import { Component, Input, OnInit } from '@angular/core';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { NgForOf, NgIf, NgClass, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Category {
    name: string;
    help: string;
    questions: QuizItem[];
}

interface Topic {
    topic: string;
    categories: Category[];
}

interface QuizItem {
    question: string;
    answer: string;
    userAnswer?: string;
    isCorrect?: boolean;
}

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
    public trophyIcon = faGraduationCap;
    public currentQuestionIndex = 0;
    public totalAnswered = 0;
    public currentPercentage = 0;
    public answeredTopics = new Set<string>();
    public selectedCategoryName = '';

    private _label = '';

    constructor(
        public urls: Urls,
        private _markdown: NgxMdService,
        private http: HttpClient
    ) {}

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
        this.http.get<Topic[]>(Urls.learnSections).subscribe(data => {
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

        const topic = this.topics.find(t => t.topic === topicName);
        if (topic) {
            const category = topic.categories.find(c => c.name === categoryName);
            if (category) {
                this.quizzes = category.questions.map((q: QuizItem) => ({
                    ...q,
                    userAnswer: '',
                    isCorrect: undefined
                }));
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
        const userAns = (quiz.userAnswer || '').trim();
        const correctAns = quiz.answer.trim();

        const userNum = parseFloat(userAns);
        const correctNum = parseFloat(correctAns);
        const isNumeric = !isNaN(userNum) && !isNaN(correctNum);

        if (isNumeric) {
            quiz.isCorrect = Math.floor(userNum) === Math.floor(correctNum);
        } else {
            quiz.isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
        }

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
        const percent = (this.correctCount / this.totalAnswered) * 100;
        this.correctPercentage = Math.round(percent);
        this.showScore = true;
        this.answeredTopics.add(this.selectedTopic);
        console.log('Answered topics:', Array.from(this.answeredTopics));
    }

    public isCategorySelected(topicName: string, categoryName: string): boolean {
        return this.selectedTopic === topicName && this.selectedCategoryName === categoryName;
    }
}
