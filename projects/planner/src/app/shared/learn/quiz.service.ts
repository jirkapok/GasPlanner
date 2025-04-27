import { Injectable } from '@angular/core';
import { NitroxCalculator, SacCalculator, DepthConverter, Precision } from 'scuba-physics';
import { Topic, QuestionTemplate, RoundType } from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';

export class QuizItem {
    public template: QuestionTemplate;
    private nitroxCalculator: NitroxCalculator;
    private sacCalculator: SacCalculator;

    constructor(
        template: QuestionTemplate,
        public categoryName: string,
        public renderedQuestion: string,
        public roundTo: number,
        public roundType: RoundType,
        public variables: number[],
        public isAnswered: boolean,
        public isCorrect: boolean,
        public userAnswer?: string,
    ) {
        this.template = template;
        const depthConverter = DepthConverter.simple();
        this.nitroxCalculator = new NitroxCalculator(depthConverter, 0.21);
        this.sacCalculator = new SacCalculator(depthConverter);
    }

    public randomizeQuizVariables(): void {
        let indexSafe = 0;

        do {
            this.variables = this.template.variables.map(variable => variable.randomizeVariable());
            indexSafe++;
        } while (Number.isNaN(this.generateCorrectAnswer()) && indexSafe < 100);
    }

    public generateCorrectAnswer(): number {

        if (this.categoryName.toLowerCase().includes('maximum operational depth')) {
            return this.nitroxCalculator.mod(this.variables[0], this.variables[1]);
        }

        if (this.categoryName.toLowerCase().includes('best mix')) {
            return this.nitroxCalculator.bestMix(this.variables[0], this.variables[1]);
        }

        if (this.categoryName.toLowerCase().includes('partial pressure')) {
            return this.nitroxCalculator.partialPressure(this.variables[0], this.variables[1]);
        }

        if (this.categoryName.toLowerCase().includes('respiratory minute volume')) {
            return this.sacCalculator.calculateSac(
                this.variables[0],
                this.variables[1],
                this.variables[2],
                this.variables[3]
            );
        }

        return NaN; // Make it clear that the question type was not recognized
    }

    public validateAnswer(): boolean {
        const userAns = (this.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (isNaN(userNum)) {
            return false;
        }

        const calculatedAnswer = this.generateCorrectAnswer();

        console.log(`Calculated Answer: ${calculatedAnswer}`);

        const expectedAnswer = this.roundValue(calculatedAnswer, this.roundTo, this.roundType);

        const userAnswerRounded = this.roundValue(userNum, this.roundTo, this.roundType);

        console.log(`User Answer: ${userAnswerRounded}, Expected Answer: ${expectedAnswer}`);

        return userAnswerRounded === expectedAnswer;
    }

    public roundValue(value: number, roundTo: number, roundType: RoundType): number {
        switch (roundType) {
            case RoundType.floor:
                return Precision.floor(value, roundTo);
            case RoundType.ceil:
                return Precision.ceil(value, roundTo);
            case RoundType.round:
            default:
                return Precision.round(value, roundTo);
        }
    }

    public renderQuestion(): void {
        let rendered = this.template.question;
        if (Array.isArray(this.template.variables)) {
            this.template.variables.forEach((variable, index) => {
                rendered = rendered.replace(new RegExp(`{${variable.name}}`, 'g'), this.variables[index].toString());
            });
        }
        this.renderedQuestion = rendered;
    }
}

@Injectable({
    providedIn: 'root'
})

export class QuizService {
    public topics: Topic[] = topics;
    public attemptsByCategory = new Map<string, { attempts: number; correct: number }>();
    public answeredCategories = new Set<string>();
    public sessionsByCategory = new Map<string, QuizSession>();

    constructor() {
        this.loadProgress();
    }

    public registerAnswer(topic: string, category: string, correct: boolean): void {
        const key = `${topic}::${category}`;
        const stats = this.attemptsByCategory.get(key) || { attempts: 0, correct: 0 };

        stats.attempts++;
        if (correct) {
            stats.correct++;
        }

        this.attemptsByCategory.set(key, stats);

        if (stats.attempts >= 5 && (stats.correct / stats.attempts) >= 0.8) {
            this.answeredCategories.add(key);
        }
        this.saveProgress();
    }

    public hasPassedCategory(topic: string, category: string): boolean {
        const key = `${topic}::${category}`;
        const stats = this.attemptsByCategory.get(key);
        return stats ? stats.attempts >= 5 && (stats.correct / stats.attempts) >= 0.8 : false;
    }

    public countFinishedCategories(topic: Topic): number {
        return topic.categories.filter(cat =>
            this.answeredCategories.has(`${topic.topic}::${cat.name}`)
        ).length;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        const finished = this.countFinishedCategories(topic);
        const total = topic.categories.length;
        const color = finished === total ? 'bg-success' : 'bg-warning';
        return { finished, total, color };
    }

    public saveProgress(): void {
        const attemptsArray = Array.from(this.attemptsByCategory.entries());
        const answeredArray = Array.from(this.answeredCategories);

        localStorage.setItem('quiz-attempts', JSON.stringify(attemptsArray));
        localStorage.setItem('quiz-answered', JSON.stringify(answeredArray));
    }

    public loadProgress(): void {
        const attemptsJson = localStorage.getItem('quiz-attempts');
        const answeredJson = localStorage.getItem('quiz-answered');

        if (attemptsJson) {
            const attemptsArray = JSON.parse(attemptsJson) as [string, { attempts: number; correct: number }][];
            this.attemptsByCategory = new Map<string, { attempts: number; correct: number }>(attemptsArray);
        }

        if (answeredJson) {
            const answeredArray = JSON.parse(answeredJson) as string[];
            this.answeredCategories = new Set<string>(answeredArray);
        }
    }

    public resetProgress(): void {
        localStorage.removeItem('quiz-attempts');
        localStorage.removeItem('quiz-answered');
        this.attemptsByCategory.clear();
        this.answeredCategories.clear();
    }

}

// const isValid = Precision.isInRange(value, min, max);
// kumulativni prumer
// pokusu  = 10 , aktualini prumer 0.7
// prumer = (10 * 0.7 + novaodpoved) / (10 + 1), pokusy + 1
// spatne = 0b, s napovdedou = 1 (0.5), bez napovedy spravne  = 2 (1)
// help pokud spocital spatne
