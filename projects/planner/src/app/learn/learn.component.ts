import { Component, Input, OnInit } from '@angular/core';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { NgForOf, NgIf, NgClass, CommonModule  } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import {  faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SectionItem {
    label: string;
    path: string;
}

interface Section {
    id: string;
    title: string;
    items: SectionItem[];
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
    public sections: Section[] = [];
    public quizzes: QuizItem[] = [];
    public correctCount = 0;
    public correctPercentage = 0;
    public showScore = false;
    public activeSection = 'plan';
    public selectedPath = 'readme';
    public trophyIcon = faGraduationCap;
    public currentQuestionIndex = 0;
    public totalAnswered = 0;
    public currentPercentage = 0;
    public answeredPaths = new Set<string>();

    private _label = 'readme';
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
        this._label = value || 'readme';
        this.selectedPath = this._label;
    }

    ngOnInit(): void {
        this.http.get<Section[]>(Urls.learnSections).subscribe(data => {
            this.sections = data;

            const first = this.sections[0]?.items[0];
            if (first) {
                this.updatePath(first.path);
            }
        });

        this.http.get<QuizItem[]>(this.urls.quizUrl(this.selectedPath)).subscribe(data => {
            this.quizzes = data;
        });
    }

    public updatePath(value: string): void {
        this.selectedPath = value;

        this.http.get<QuizItem[]>(this.urls.quizUrl(value)).subscribe(data => {
            this.quizzes = data.map(q => ({
                ...q,
                userAnswer: '',
                isCorrect: undefined
            }));
            this.showScore = false;
        });
    }

    public toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
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

        // Mark the current section's path as "answered"
        this.answeredPaths.add(this.selectedPath);

        console.log('Answered paths:', Array.from(this.answeredPaths));
    }

}
