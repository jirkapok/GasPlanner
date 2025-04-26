import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Urls } from '../shared/navigation.service';
import { Observable } from 'rxjs';
import { NitroxCalculator, SacCalculator, DepthConverter } from 'scuba-physics';

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
    roundTo: number;
    variables: QuizVariable[];
    userAnswer?: string;
    isAnswered: boolean;
    isCorrect: boolean;
    renderedQuestion?: string;
}

export interface QuizVariable {
    name: string;
    min?: number;
    max?: number;
    options?: number[];
    value?: number; // generated value
}

@Injectable({
    providedIn: 'root'
})
export class QuizService {
    private nitroxCalculator: NitroxCalculator;
    private sacCalculator: SacCalculator;

    constructor(private http: HttpClient) {
        const depthConverter = DepthConverter.simple();
        this.nitroxCalculator = new NitroxCalculator(depthConverter, 0.21);
        this.sacCalculator = new SacCalculator(depthConverter);
    }

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
            isCorrect: false,
            isAnswered: false,
        }));
    }

    public validateAnswer(userAnswer: string, correctAnswer: number, roundTo: number): boolean {
        const userAns = (userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (isNaN(userNum)) {
            return false;
        }

        const factor = Math.pow(10, roundTo);

        const expectedAnswer = Math.round(correctAnswer * factor) / factor;
        const userAnswerRounded = Math.round(userNum * factor) / factor;

        return userAnswerRounded === expectedAnswer;
    }

    public generateCorrectAnswer(quizItem: QuizItem): number {
        const variables: Record<string, number | undefined> = Object.fromEntries(
            quizItem.variables.map(v => [v.name, v.value])
        );

        if (quizItem.question.includes('maximum operational depth')) {
            return this.nitroxCalculator.mod(variables['pp'] ?? 1, variables['o2_percent'] ?? 1);
        }

        if (quizItem.question.includes('best mix')) {
            return this.nitroxCalculator.bestMix(variables['pp'] ?? 1, variables['depth'] ?? 1);
        }

        if (quizItem.question.includes('partial pressure')) {
            return this.nitroxCalculator.partialPressure(variables['o2_percent'] ?? 1, variables['depth'] ?? 1);
        }

        if (quizItem.question.includes('respiratory minute volume')) {
            const used = variables['consumed_pressure'] ?? 1;
            const tankSize = variables['tank_size'] ?? 1;
            const duration = variables['time'] ?? 1;
            const depth = variables['depth'] ?? 1;

            this.sacCalculator.calculateSac(depth, tankSize, used, duration);
        }

        return NaN; // Make it clear that the question type was not recognized
    }


    public randomizeVariable(variable: QuizVariable): number | undefined {
        if (typeof variable.min === 'number' && typeof variable.max === 'number') {
            const min = variable.min;
            const max = variable.max;
            const decimals = Math.max(
                (min.toString().split('.')[1]?.length || 0),
                (max.toString().split('.')[1]?.length || 0)
            );

            const randomValue = Math.random() * (max - min) + min;
            return parseFloat(randomValue.toFixed(decimals));
        } else if (Array.isArray(variable.options)) {
            const randomIndex = Math.floor(Math.random() * variable.options.length);
            return variable.options[randomIndex];
        }
        return undefined;
    }

    public randomizeQuizVariables(quizItem: QuizItem): void {
        quizItem.variables.forEach(variable => {
            variable.value = this.randomizeVariable(variable);
        });
    }
}
