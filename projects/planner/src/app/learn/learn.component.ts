import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal,faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService, QuizItem } from '../shared/learn/quiz.service';
import { Category, RoundType, Topic } from '../shared/learn/learn.models';
import { QuizSession } from '../shared/learn/quiz-session.model';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';

@Component({
    selector: 'app-learn',
    imports: [CommonModule, NgxMdModule, FontAwesomeModule, NgForOf, NgIf, NgClass, FormsModule],
    templateUrl: './learn.component.html',
    styleUrls: ['./learn.component.scss']
})
export class LearnComponent implements OnInit {

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
            this.session = undefined;
            return;
        }

        const key = `${topicName}::${categoryName}`;
        let session = this.quizService.sessionsByCategory.get(key);

        if (!session) {
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
        this.quizService.registerAnswer(this.selectedTopic, this.selectedCategoryName, this.session.currentQuiz?.isCorrect ?? false);
    }

    public getRoundingExplanation(roundType: RoundType, roundTo: number): string {
        switch (roundType) {
            case RoundType.round:
                return `Round your answer to ${roundTo} decimal place(s).`;
            case RoundType.floor:
                return `Round down to ${roundTo} decimal place(s).`;
            case RoundType.ceil:
                return `Round up to ${roundTo} decimal place(s).`;
            default:
                return ' ';
        }
    }

    public goToNextQuestion(): void {
        this.session?.goToNextQuestion();
    }

    public submitAnswers(): void {
        this.session?.finishIfEligible();
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
}
