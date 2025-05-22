import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal, faCircleInfo, faUndo, faChartSimple } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { CategoryStatus, QuizService, TopicStatus } from '../shared/learn/quiz.service';
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
    public showScore = false;

    constructor(
        public quizService: QuizService,
        private help: HelpService,
        private preferencesStore: PreferencesStore,
        private viewStates: SubViewStorage,
    ) {
        this.loadState();
    }

    public get topics(): Topic[] {
        return this.quizService.topics;
    }

    public get session(): QuizSession {
        return this.quizService.session;
    }

    public get selectedTopic(): Topic {
        return this.quizService.selectedTopic;
    }

    public get selectedCategory(): Category {
        return this.quizService.selectedCategory;
    }

    public get currentQuiz(): QuizItem {
        return this.quizService.question;
    }

    public get correctPercentage(): number {
        return this.session.correctPercentage;
    }

    public get showSubmitButton(): boolean {
        return !this.currentQuiz.isAnswered;
    }

    public get showNextQuestionButton(): boolean {
        return this.currentQuiz.isAnswered;
    }

    public select(topic: Topic, category: Category): void {
        this.quizService.select(topic, category);
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
        this.select(topic, topic.categories[0]);
    }

    public validateCurrentAnswer(): void {
        this.quizService.validateCurrentAnswer();
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
    }

    public goToNextQuestion(): void {
        this.quizService.goToNextQuestion();
    }

    // TODO fix primary button to submit
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

    public topicStatus(topic: Topic): TopicStatus {
        return this.quizService.topicStatus(topic);
    }

    public categoryStatus(category: Category): CategoryStatus {
        return this.quizService.categoryStatus(category);
    }

    public resetSession(): void {
        this.session.reset();
        this.goToNextQuestion();
        this.preferencesStore.save();
    }

    private loadState(): void {
        let state: LearnViewState = this.viewStates.loadView(
            KnownViews.learn
        );

        if (!state) {
            state = this.createState();
        }

        this.quizService.selectByName(state.topic, state.category);
        this.saveState();
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
