import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal, faCircleInfo, faUndo, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService } from '../shared/learn/quiz.service';
import { Category, RoundType, Topic } from '../shared/learn/learn.models';
import { QuizSession } from '../shared/learn/quiz-session.model';
import confetti from 'canvas-confetti';
import { PreferencesStore } from '../shared/preferencesStore';
import { QuizItem } from '../shared/learn/quiz-item.model';
import { LearnViewState } from "../shared/views.model";
import { KnownViews } from "../shared/viewStates";
import { SubViewStorage } from "../shared/subViewStorage";
import { HelpService } from "../shared/learn/help.service";

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
    public readonly statsIcon = faChartSimple;
    public readonly resetIcon = faUndo;
    public readonly topics: Topic[] = [];

    public showScore = false;
    public session!: QuizSession;
    public selectedTopic: Topic;
    public selectedCategory: Category;

    constructor(
        public quizService: QuizService,
        private help: HelpService,
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

    public get showSubmitButton(): boolean {
        return this.currentQuiz !== undefined && !this.currentQuiz.isAnswered;
    }

    public get showNextQuestionButton(): boolean {
        return this.currentQuiz.isAnswered;
    }

    public get showQuestion(): boolean {
        return !this.showScore && this.session.quizzes.length > 0;
    }

    public get showResetButton(): boolean {
        return this.session.totalAnswered > 0;
    }

    public updateTopic(topic: Topic, category: Category): void {
        this.selectedTopic = topic;
        this.selectedCategory = category;
        this.session = this.getOrCreateSession(category);
        this.saveState();
    }

    public openHelp(): void {
        this.help.openQuizHelp();
    }

    public openQuestionHelp(): void {
        const category = this.selectedCategory;

        if (!category || !category.help) {
            return;
        }

        this.session.useHint();
        this.help.openHelp(category.help);
    }

    public toggleTopic(topic: Topic): void {
        this.updateTopic(topic, topic.categories[0]);
    }

    public validateCurrentAnswer(): void {
        this.session.validateCurrentAnswer();
        this.preferencesStore.save();

        if(this.session.shouldCelebrate) {
            this.switchToScore();
        }
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
        this.showScore = false;
        this.goToNextQuestion();
        this.session.currentQuestionIndex = this.session.quizzes.length - 1;
    }

    public goToNextQuestion(): void {
        this.session.goToNextQuestion();
    }

    public switchToScore(): void {
        this.showScore = true;

        if (this.session.shouldCelebrate) {
            this.session.markCelebrated();

            setTimeout(() => {
                if (this.completionBlockRef?.nativeElement) {
                    this.launchConfettiFromElement(this.completionBlockRef.nativeElement);
                } else {
                    this.launchConfetti();
                }
            }, 50);
        }
    }

    public isCategorySelected(topic: Topic, category: Category): boolean {
        return this.selectedTopic === topic && this.selectedCategory === category;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; hasTrophy: boolean  } {
        return this.quizService.getTopicCompletionStatus(topic);
    }

    public getQuizStats(categoryName: string): { score: number; showScore: boolean; finished: boolean; attempts:number;  required: number } {
        const session = this.quizService.sessionsByCategory.get(categoryName);
        if (!session) {
            return { score: 0, showScore: false, finished: false, attempts:0,  required: QuizSession.requiredAnsweredCount };
        }
        return {
            score: session.correctPercentage,
            showScore: session.totalAnswered > QuizSession.requiredAnsweredCount,
            finished: session.trophyGained,
            attempts: session.totalAnswered,
            required: QuizSession.requiredAnsweredCount,
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

        const foundTopic = this.topics.find(t => t.name === state.topic);
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
            topic: this.selectedTopic.name,
            category: this.selectedCategory.name
        }
    }
}
