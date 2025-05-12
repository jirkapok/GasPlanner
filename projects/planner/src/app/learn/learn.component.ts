import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService, QuizItem } from '../shared/learn/quiz.service';
import { Category, RoundType, Topic } from '../shared/learn/learn.models';
import { QuizSession } from '../shared/learn/quiz-session.model';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import confetti from 'canvas-confetti';
import { QuizAnswerStats } from '../shared/serialization.model';

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

    public session: QuizSession | undefined;
    public activeTopic = '';
    public selectedTopic = '';
    public selectedCategory: Category | undefined;
    public selectedCategoryName = '';

    private _label = '';

    constructor(
        public quizService: QuizService,
        private modalService: MdbModalService
    ) {
        this.topics = quizService.topics;
    }

    get currentQuiz(): QuizItem | undefined {
        return this.session?.currentQuiz;
    }

    public get correctPercentage(): number {
        return this.session?.correctPercentage ?? 0;
    }

    public get label(): string {
        return this._label;
    }

    public get scoreSummary(): string {
        return this.session?.scoreSummary ?? '';
    }

    @Input()
    public set label(value: string) {
        this._label = value || '';
        this.selectedTopic = this._label;
    }

    ngOnInit(): void {
        this.quizService.initializeStats();

        const firstTopic = this.topics[0];
        const firstCategory = firstTopic?.categories[0];

        if (firstTopic && firstCategory) {
            this.updateTopic(firstTopic.topic, firstCategory.name);
        }
    }

    public updateTopic(topicName: string, categoryName: string): void {
        this.selectedTopic = topicName;
        this.selectedCategoryName = categoryName;
        this.activeTopic = topicName;

        const topic = this.topics.find(t => t.topic === topicName);
        const category = topic?.categories.find(c => c.name === categoryName);

        this.selectedCategory = category;

        if (!category) {
            this.session = new QuizSession([], {} as Category);
            return;
        }

        const key = `${topicName}::${categoryName}`;
        let session = this.quizService.sessionsByCategory.get(key);

        if (!session || session.finished) {
            const quizzes = [category.getQuizItemForCategory()];
            session = new QuizSession(quizzes, category);
            this.quizService.sessionsByCategory.set(key, session);
        }

        this.session = session;
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

        if (this.session) {
            this.session.useHint();
        }

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
        if (!this.session) {
            return;
        }

        this.session.validateCurrentAnswer();
        this.quizService.registerAnswer(
            this.selectedTopic,
            this.selectedCategoryName,
            this.session.currentQuiz?.isCorrect ?? false
        );
    }

    public getRoundingExplanation(roundType: RoundType): string {
        switch (roundType) {
            case RoundType.floor:
                return 'down';
            case RoundType.ceil:
                return 'up';
            case RoundType.round:
            default:
                return 'your answer';
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

    public getQuizStats(key: string): QuizAnswerStats {
        return this.quizService.quizAnswers.get(key) ?? this.quizService.createDefaultStats();
    }

    public goToNextQuestion(): void {
        this.session?.goToNextQuestion();
    }

    public submitAnswers(): void {
        if (this.session?.finishIfEligible()) {
            // Wait for Angular to render the #completionBlock element
            setTimeout(() => {
                if (this.completionBlockRef?.nativeElement) {
                    this.launchConfettiFromElement(this.completionBlockRef.nativeElement);
                } else {
                    this.launchConfetti();
                }
            }, 50);
        }
    }

    public isCategorySelected(topicName: string, categoryName: string): boolean {
        return this.selectedTopic === topicName && this.selectedCategoryName === categoryName;
    }

    public hasPassedCategory(): boolean {
        return this.quizService.hasPassedCategory(this.selectedTopic, this.selectedCategoryName);
    }

    public countFinishedCategories(topic: Topic): number {
        return this.quizService.countFinishedCategories(topic);
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        return this.quizService.getTopicCompletionStatus(topic);
    }

    public shouldShowSubmitButton(): boolean {
        return this.currentQuiz !== undefined && !this.currentQuiz.isAnswered;
    }

    public shouldShowNextQuestionButton(): boolean {
        return !!this.currentQuiz?.isAnswered && !(this.session?.finished);
    }

    public shouldShowFinishButton(): boolean {
        return this.session?.canFinishSession() ?? false;
    }

    public shouldShowScore(): boolean {
        return this.session?.finished ?? false;
    }

    public shouldShowForm(): boolean {
        return !this.session?.finished && (this.session?.quizzes?.length ?? 0) > 0;
    }

    public isBadgeEarned(topic: Topic, category: Category): boolean {
        return this.quizService.isCategoryCompleted(topic, category);
    }
}
