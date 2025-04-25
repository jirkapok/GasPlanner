import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Urls } from '../shared/navigation.service';
import { Observable } from 'rxjs';

export interface Category {
    name: string;
    help: string;
    questions: QuizItem[];
}

export interface Topic {
    topic: string;
    categories: Category[];
}

export interface QuizItem {
    question: string;
    answer: string;
    userAnswer?: string;
    isCorrect?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    constructor(private http: HttpClient) {}

    public loadTopics(): Observable<Topic[]> {
        return this.http.get<Topic[]>(Urls.learnSections);
    }

    public getQuizzesForCategory(topic: Topic, categoryName: string): QuizItem[] {
        const category = topic.categories.find(c => c.name === categoryName);
        if (!category) {
            return [];
        }

        return category.questions.map((q: QuizItem) => ({
            ...q,
            userAnswer: '',
            isCorrect: undefined
        }));
    }

    public validateAnswer(userAnswer: string, correctAnswer: string): boolean {
        const userAns = (userAnswer || '').trim();
        const correctAns = (correctAnswer || '').trim();

        const userNum = parseFloat(userAns);
        const correctNum = parseFloat(correctAns);
        const isNumeric = !isNaN(userNum) && !isNaN(correctNum);

        if (isNumeric) {
            return Math.floor(userNum) === Math.floor(correctNum);
        } else {
            return userAns.toLowerCase() === correctAns.toLowerCase();
        }
    }
}
