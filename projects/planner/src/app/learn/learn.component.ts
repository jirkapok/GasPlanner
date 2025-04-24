import { Component, Input, OnInit } from '@angular/core';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { NgForOf, NgIf, NgClass  } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';

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
    imports: [NgxMdModule, FontAwesomeModule, NgForOf, NgIf, NgClass, FormsModule, MdbTabsModule],
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
    public path = this.urls.infoUrl(this.label);
    public headerIcon = faCircleInfo;
    public trophyIcon = faGraduationCap;

    private _label = 'readme';
    constructor(
        public urls: Urls,
        private _markdown: NgxMdService,
        private http: HttpClient
    ) {}

    public get label(): string {
        return this._label;
    }

    @Input()
    public set label(value: string) {
        this._label = value || 'readme';
        this.path = this.urls.infoUrl(this._label);
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

    updatePath(value: string): void {
        this.selectedPath = value;
        this.path = this.urls.infoUrl(value);

        this.http.get<QuizItem[]>(this.urls.quizUrl(value)).subscribe(data => {
            this.quizzes = data.map(q => ({
                ...q,
                userAnswer: '',
                isCorrect: undefined
            }));
            this.showScore = false;
        });
    }

    onLoad() {
        this._markdown.renderer.image = (href: string, title: string, text: string) =>
            `<img src="${this.urls.infoImageUrl(href)}" alt="${text}" class="w-100 p-3" title="${text}">`;

        this._markdown.renderer.link = (href: string, title: string, text: string) => {

            if (href?.startsWith('./') && href?.endsWith('.md')) {
                const sanitizedHref = href.replace('./', '').replace('.md', '');
                return `<a href="/help/${sanitizedHref}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };
    }

    toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }

    submitAnswers(): void {
        this.correctCount = 0;

        this.quizzes.forEach(quiz => {
            const userAns = (quiz.userAnswer || '').trim();
            const correctAns = quiz.answer.trim();

            // Try parsing as numbers
            const userNum = parseFloat(userAns);
            const correctNum = parseFloat(correctAns);

            const isNumeric = !isNaN(userNum) && !isNaN(correctNum);

            if (isNumeric) {
                // Accept if floored user input matches floored correct answer
                quiz.isCorrect = Math.floor(userNum) === Math.floor(correctNum);
            } else {
                // Fall back to text comparison
                quiz.isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();
            }

            if (quiz.isCorrect) {
                this.correctCount++;
            }
        });

        this.correctPercentage = Math.round((this.correctCount / this.quizzes.length) * 100);
        this.showScore = true;
    }
}
