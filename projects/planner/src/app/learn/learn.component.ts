import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService, QuizItem } from '../shared/learn/quiz.service';
import { Topic, Category } from '../shared/learn/learn.models'; // <-- Correct import

@Component({
    selector: 'app-learn',
    standalone: true,
    imports: [CommonModule, NgxMdModule, FontAwesomeModule, NgForOf, NgIf, NgClass, FormsModule],
    templateUrl: './learn.component.html',
    styleUrls: ['./learn.component.scss']
})
export class LearnComponent implements OnInit {
    public topics: Topic[] = [];
    public quizzes: QuizItem[] = [];
    public correctCount = 0;
    public correctPercentage = 0;
    public showScore = false;
    public activeTopic = '';
    public selectedTopic = '';
    public selectedCategoryName = '';
    public currentQuestionIndex = 0;
    public totalAnswered = 0;
    public currentPercentage = 0;
    public answeredCategories = new Set<string>();
    public trophyIcon = faMedal;
    public attemptsByCategory = new Map<string, { attempts: number; correct: number }>();

    private _label = '';

    constructor(private quizService: QuizService) {}

    get currentQuiz(): QuizItem {
        return this.quizzes[this.currentQuestionIndex];
    }

    public get label(): string {
        return this._label;
    }

    @Input()
    public set label(value: string) {
        this._label = value || '';
        this.selectedTopic = this._label;
    }

    ngOnInit(): void {
        // Updated here: No more subscribe, just direct assignment
        this.topics = this.quizService.topics;

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
        if (topic) {
            this.quizzes = [];

            // Generate 5 random quizzes from selected category
            const category = topic.categories.find((c: Category) => c.name === categoryName);
            if (category) {
                for (let i = 0; i < 5; i++) {
                    const quizItem = this.quizService.getQuizItemForCategory(category);
                    this.quizzes.push(quizItem);
                }
            }

            this.showScore = false;
            this.correctCount = 0;
            this.totalAnswered = 0;
            this.currentPercentage = 0;
            this.currentQuestionIndex = 0;
        }
    }

    public toggleTopic(topicName: string): void {
        this.activeTopic = this.activeTopic === topicName ? '' : topicName;
    }

    public validateCurrentAnswer(): void {
        const quiz = this.currentQuiz;
        if (!quiz) {
            return;
        }

        quiz.isCorrect = this.quizService.validateAnswer(quiz);
        quiz.isAnswered = true;

        const key = `${this.selectedTopic}::${this.selectedCategoryName}`;
        const stats = this.attemptsByCategory.get(key) || { attempts: 0, correct: 0 };

        stats.attempts += 1;
        if (quiz.isCorrect) {
            stats.correct += 1;
        }

        this.attemptsByCategory.set(key, stats);

        if (stats.attempts >= 5 && (stats.correct / stats.attempts) >= 0.8) {
            this.answeredCategories.add(key);
        }

        this.totalAnswered++;
        if (quiz.isCorrect) {
            this.correctCount++;
        }
        this.currentPercentage = Math.round((this.correctCount / this.totalAnswered) * 100);
    }

    public goToNextQuestion(): void {
        if (this.currentQuestionIndex < this.quizzes.length - 1) {
            this.currentQuestionIndex++;
        }
    }

    public submitAnswers(): void {
        this.correctPercentage = Math.round((this.correctCount / this.totalAnswered) * 100);
        this.showScore = true;
    }

    public isCategorySelected(topicName: string, categoryName: string): boolean {
        return this.selectedTopic === topicName && this.selectedCategoryName === categoryName;
    }

    public hasPassedCategory(): boolean {
        const key = `${this.selectedTopic}::${this.selectedCategoryName}`;
        const stats = this.attemptsByCategory.get(key);
        return stats ? stats.attempts >= 5 && (stats.correct / stats.attempts) >= 0.8 : false;
    }

    public countFinishedCategories(topic: Topic): number {
        let count = 0;
        for (const category of topic.categories) {
            if (this.answeredCategories.has(`${topic.topic}::${category.name}`)) {
                count++;
            }
        }
        return count;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        const total = topic.categories.length;
        let finished = 0;

        for (const category of topic.categories) {
            if (this.answeredCategories.has(`${topic.topic}::${category.name}`)) {
                finished++;
            }
        }

        const color = finished === total ? 'bg-success' : 'bg-warning';

        return { finished, total, color };
    }

    public shouldShowSubmitButton(): boolean {
        return !this.currentQuiz.isAnswered;
    }

    public shouldShowNextQuestionButton(): boolean {
        return this.currentQuiz.isAnswered && this.currentQuestionIndex < this.quizzes.length - 1;
    }

    public shouldShowFinishButton(): boolean {
        return this.currentQuiz.isAnswered && this.currentQuestionIndex >= this.quizzes.length - 1;
    }

    public shouldShowScore(): boolean {
        return this.showScore;
    }

    public shouldShowForm(): boolean {
        return !this.showScore && this.quizzes.length > 0;
    }
}
