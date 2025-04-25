import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import { NgxMdModule } from 'ngx-md';
import { QuizService, Topic, QuizItem } from '../shared/quiz.service';

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
        this.quizService.loadTopics().subscribe(data => {
            this.topics = data;
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

        const topic = this.topics.find(t => t.topic === topicName);
        if (topic) {
            this.quizzes = this.quizService.getQuizzesForCategory(topic, categoryName);

            this.quizzes.forEach(quiz => {
                this.quizService.randomizeQuizVariables(quiz);
                quiz.renderedQuestion = this.renderQuestion(quiz);
            });

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

        const correctAnswer = this.quizService.generateCorrectAnswer(quiz);

        quiz.isCorrect = this.quizService.validateAnswer(quiz.userAnswer || '', correctAnswer, quiz.roundTo ?? 1);

        if (quiz.isCorrect) {
            this.correctCount++;
        }

        this.totalAnswered++;
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

        const key = `${this.selectedTopic}::${this.selectedCategoryName}`;
        this.answeredCategories.add(key);
    }

    public isCategorySelected(topicName: string, categoryName: string): boolean {
        return this.selectedTopic === topicName && this.selectedCategoryName === categoryName;
    }

    public renderQuestion(quiz: QuizItem): string {
        let questionText = quiz.question;

        if (Array.isArray(quiz.variables)) {
            quiz.variables.forEach(variable => {
                const value = variable.value ?? '';

                let displayValue = value;
                if (typeof value === 'number') {
                    if (variable.name.includes('percent') || variable.name.includes('tank_size') || variable.name.includes('depth')) {
                        displayValue = value.toFixed(0); // Whole numbers for percentages, tank sizes, depth
                    } else {
                        displayValue = value.toFixed(2); // Default to 2 decimals for pressures etc.
                    }
                }

                questionText = questionText.replace(new RegExp(`{${variable.name}}`, 'g'), displayValue.toString());
            });
        }

        return questionText;
    }

}
