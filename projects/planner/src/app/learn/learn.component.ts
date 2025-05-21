import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal, faCircleInfo, faUndo } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService } from '../shared/learn/quiz.service';
import { Category, RoundType, Topic } from '../shared/learn/learn.models';
import { QuizSession } from '../shared/learn/quiz-session.model';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import confetti from 'canvas-confetti';
import { PreferencesStore } from '../shared/preferencesStore';
import { QuizItem } from '../shared/learn/quiz-item.model';
import { LearnViewState } from "../shared/views.model";
import { KnownViews } from "../shared/viewStates";
import { SubViewStorage } from "../shared/subViewStorage";

@Component({
    selector: 'app-learn',
    standalone: true,
    imports: [CommonModule, NgxMdModule, FontAwesomeModule, NgForOf, NgIf, NgClass, FormsModule],
    templateUrl: './learn.component.html',
    styleUrls: ['./learn.component.scss']
})
export class LearnComponent {

    @ViewChild('completionBlock', { static: false }) completionBlockRef!: ElementRef<HTMLElement>;

    public readonly trophyIcon = faMedal;
    public readonly helpIcon = faCircleInfo;
    public readonly resetIcon = faUndo;
    public readonly topics: Topic[] = [];

    public session!: QuizSession;
    public selectedTopic: Topic;
    public selectedCategory: Category;

    constructor(
        public quizService: QuizService,
        private modalService: MdbModalService,
        private preferencesStore: PreferencesStore,
        private viewStates: SubViewStorage,
    ) {
        this.topics = quizService.topics;
        this.selectedTopic = this.topics[0];
        this.selectedCategory = this.selectedTopic.categories[0];
        this.loadState();
    }

    public get currentQuiz(): QuizItem {
        return this.session.currentQuiz;
    }

    public get correctPercentage(): number {
        return this.session.correctPercentage;
    }

    public get scoreSummary(): string {
        return this.session.scoreSummary;
    }

    public updateTopic(topic: Topic, category: Category): void {
        this.selectedTopic = topic;
        this.selectedCategory = category;
        this.session = this.getOrCreateSession(category);
        this.saveState();
    }

    public openHelp(): void {
        // TODO merge this call to one function and put path constants to the urls class
        this.modalService.open(HelpModalComponent, {
            data: {
                path: 'quiz-help'
            }
        });
    }

    public openHelpModal(): void {
        const category = this.selectedCategory;

        if (!category || !category.help) {
            return;
        }

        this.session.useHint();

        this.modalService.open(HelpModalComponent, {
            data: {
                path: category.help
            }
        });
    }

    public toggleTopic(topic: Topic): void {
        this.updateTopic(topic, topic.categories[0]);
    }

    public validateCurrentAnswer(): void {
        this.session.validateCurrentAnswer();
        this.preferencesStore.save();
    }

    public getRoundingExplanation(roundType: RoundType): string {
        switch (roundType) {
            case RoundType.floor:
                return 'down';
            case RoundType.ceil:
                return 'up';
            case RoundType.round:
            default:
                return '';
        }
    }

    public launchConfetti(): void {
        confetti({
            particleCount: 240,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#00c6ff', '#0072ff', '#ffffff'],
        });
    }

    public launchConfettiFromElement(el: HTMLElement): void {
        const rect = el.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 240,
            spread: 90,
            origin: { x, y }
        });
    }

    public continuePracticing(): void {
        this.session.finished = false;
        this.goToNextQuestion();
        this.session.currentQuestionIndex = this.session.quizzes.length - 1;
    }

    public goToNextQuestion(): void {
        this.session.goToNextQuestion();
    }

    public getTrophyColor(category: Category): string {
        const key = category.name;
        const session = this.quizService.sessionsByCategory.get(key);
        return session?.trophyGained ? 'text-warning' : 'text-muted';
    }

    public submitAnswers(): void {
        if (this.session.canFinishSession()) {
            const didFinish = this.session.finishIfEligible();

            if (didFinish) {
                setTimeout(() => {
                    if (this.completionBlockRef?.nativeElement) {
                        this.launchConfettiFromElement(this.completionBlockRef.nativeElement);
                    } else {
                        this.launchConfetti();
                    }
                }, 50);
            }

            this.preferencesStore.save();
        }
    }

    public isCategorySelected(topic: Topic, category: Category): boolean {
        return this.selectedTopic === topic && this.selectedCategory === category;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        return this.quizService.getTopicCompletionStatus(topic);
    }

    public shouldShowSubmitButton(): boolean {
        return this.currentQuiz !== undefined && !this.currentQuiz.isAnswered;
    }

    public shouldShowNextQuestionButton(): boolean {
        return this.currentQuiz.isAnswered && !(this.session.finished);
    }

    public shouldShowFinishButton(): boolean {
        return this.session.canFinishSession();
    }

    public shouldShowScore(): boolean {
        return this.session.finished;
    }

    public shouldShowForm(): boolean {
        return !this.session.finished && this.session.quizzes.length > 0;
    }

    public shouldShowResetButton(): boolean {
        return this.session.totalAnswered > 0;
    }

    public getQuizStats(categoryName: string): { attempts: number; correct: number } {
        const session = this.quizService.sessionsByCategory.get(categoryName);
        if (!session) {
            return { attempts: 0, correct: 0 };
        }
        return {
            attempts: session.totalAnswered,
            correct: session.correctCount
        };
    }

    public resetSession(): void {
        this.session.reset();
        this.preferencesStore.save();
    }

    private getOrCreateSession(category: Category): QuizSession {
        const existing = this.quizService.sessionsByCategory.get(category.name);
        if (existing) {
            return existing;
        }

        const session = new QuizSession([category.getQuizItemForCategory()], category);
        this.quizService.sessionsByCategory.set(category.name, session);
        return session;
    }

    private loadState(): void {
        let state: LearnViewState = this.viewStates.loadView(
            KnownViews.learn
        );

        if (!state) {
            state = this.createState();
        }

        const foundTopic = this.topics.find(t => t.topic === state.topic);
        const loadedTopic = foundTopic || this.topics[0];
        const foundCategory = loadedTopic.categories.find(c => c.name === state.category);
        const loadedCategory = foundCategory || loadedTopic.categories[0];
        this.updateTopic(loadedTopic, loadedCategory);
    }

    private saveState(): void {
        const state = this.createState();
        this.viewStates.saveView<LearnViewState>(state);
    }

    private createState(): LearnViewState {
        return {
            id:  KnownViews.learn,
            topic: this.selectedTopic.topic,
            category: this.selectedCategory.name
        }
    }
}
