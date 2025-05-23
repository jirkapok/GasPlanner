import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService } from '../shared/learn/quiz.service';
import { Category, RoundType, Topic } from '../shared/learn/learn.models';
import { QuizSession } from '../shared/learn/quiz-session.model';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import confetti from 'canvas-confetti';
import { PreferencesStore } from '../shared/preferencesStore';
import { QuizItem } from '../shared/learn/quiz-item.model';

@Component({
    selector: 'app-learn',
    standalone: true,
    imports: [CommonModule, NgxMdModule, FontAwesomeModule, NgForOf, NgIf, NgClass, FormsModule],
    templateUrl: './learn.component.html',
    styleUrls: ['./learn.component.scss']
})
export class LearnComponent implements OnInit {

    @ViewChild('completionBlock', { static: false }) completionBlockRef!: ElementRef<HTMLElement>;

    public readonly trophyIcon = faMedal;
    public readonly helpIcon = faCircleInfo;
    public readonly topics: Topic[] = [];

    public session: QuizSession;
    public activeTopic = '';
    public selectedTopic = '';
    public selectedCategory: Category;
    public selectedCategoryName = '';

    private _label = '';

    constructor(
        public quizService: QuizService,
        private modalService: MdbModalService,
        private preferencesStore: PreferencesStore
    ) {
        this.topics = quizService.topics;
        this.selectedTopic = this.topics[0].topic;
        this.selectedCategoryName = this.topics[0].categories[0].name;
        this.selectedCategory = this.findCategory(this.selectedTopic, this.selectedCategoryName);
        this.session = this.getOrCreateSession(this.selectedCategoryName);
    }

    public get currentQuiz(): QuizItem {
        return this.session.currentQuiz;
    }

    public get correctPercentage(): number {
        return this.session.correctPercentage;
    }

    public get label(): string {
        return this._label;
    }

    public get scoreSummary(): string {
        return this.session.scoreSummary;
    }

    @Input()
    public set label(value: string) {
        this._label = value || '';
        this.selectedTopic = this._label;
    }

    public ngOnInit(): void {
        setTimeout(() => {
            const firstTopic = this.topics[0];
            const firstCategory = firstTopic?.categories[0];
            if (firstTopic && firstCategory) {
                this.updateTopic(firstTopic.topic, firstCategory.name);
            }
        });
    }

    public updateTopic(topicName: string, categoryName: string): void {
        this.selectedTopic = topicName;
        this.selectedCategoryName = categoryName;
        this.activeTopic = topicName;
        this.session = this.getOrCreateSession(categoryName);
    }

    public openHelp(): void {
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

    public toggleTopic(topicName: string): void {
        this.activeTopic = this.activeTopic === topicName ? '' : topicName;
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
            particleCount: 150,
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
            particleCount: 120,
            spread: 80,
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

    public getTrophyColor(topic: Topic, category: Category): string {
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

    public isCategorySelected(topicName: string, categoryName: string): boolean {
        return this.selectedTopic === topicName && this.selectedCategoryName === categoryName;
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

    private findCategory(topicName: string, categoryName: string): Category {
        const topic = this.topics.find(t => t.topic === topicName);

        if (!topic) {
            return Topic.getEmptyCategory();
        }

        return topic.getCategoryByNameOrEmpty(categoryName);
    }

    private getOrCreateSession(categoryName: string): QuizSession {
        const key = categoryName;
        const existing = this.quizService.sessionsByCategory.get(key);
        if (existing) {
            return existing;
        }
        const category = this.findCategory(this.selectedTopic, categoryName);

        const session = new QuizSession([category.getQuizItemForCategory()], category);
        this.quizService.sessionsByCategory.set(key, session);
        return session;
    }
}
