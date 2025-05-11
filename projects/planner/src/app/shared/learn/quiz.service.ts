import { Injectable } from '@angular/core';
import {
    NitroxCalculator, SacCalculator, DepthConverter,
    Precision, GasProperties
} from 'scuba-physics';
import { Topic, QuestionTemplate, RoundType, QuizItemTools } from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { AppPreferences, QuizAnswerStats } from '../serialization.model';

export class QuizItem {
    public correctAnswer?: number;

    public roundTo: number;
    public roundType: RoundType;
    public variables: number[] = [];
    public isAnswered = false;
    public isCorrect = false;
    public userAnswer?: string;
    public renderedQuestion = '';

    private depthConverter: DepthConverter;
    private nitroxCalculator: NitroxCalculator;
    private sacCalculator: SacCalculator;
    private gasProperties: GasProperties;

    constructor(
        public template: QuestionTemplate,
        public categoryName: string
    ) {
        this.roundTo = template.roundTo;
        this.roundType = template.roundType;

        this.depthConverter = DepthConverter.simple();
        this.nitroxCalculator = new NitroxCalculator(this.depthConverter, 0.21);
        this.sacCalculator = new SacCalculator(this.depthConverter);
        this.gasProperties = new GasProperties();

        this.randomizeQuizVariables();
        this.renderQuestion();
    }

    public randomizeQuizVariables(): void {
        let indexSafe = 0;

        do {
            this.variables = this.template.variables.map(variable => variable.randomizeVariable());
            indexSafe++;
        } while (Number.isNaN(this.generateCorrectAnswer()) && indexSafe < 100);

        console.log(`Randomized result: ${this.generateCorrectAnswer()}`);
    }

    public generateCorrectAnswer(): number {
        // Depth: this.depthConverter.fromBar(this.variables[0])
        // Pressure: this.depthConverter.toBar(this.variables[0])
        // Equivalent air depth: this.nitroxCalculator.ead(this.variables[0], this.variables[1]);
        // SAC: this.sacCalculator.calculateSac() / tank size
        // Used gas: this.sacCalculator.calculateUsed()
        // Dive Duration: this.sacCalculator.calculateDuration()
        // Minimum depth: this.gasProperties.minDepth
        // Equivalent narcotic depth:  this.gasProperties.end
        // Maximum narcotic depth this.gasProperties.mnd

        const tools: QuizItemTools = {
            depthConverter: this.depthConverter,
            nitroxCalculator: this.nitroxCalculator,
            sacCalculator: this.sacCalculator,
            gasProperties: this.gasProperties
        };

        if (typeof this.template.calculateAnswer === 'function') {
            return this.template.calculateAnswer(this.variables, tools);
        }

        throw new Error('Invalid question template: missing calculateAnswer');
    }

    public validateAnswer(): boolean {
        const userAns = (this.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (isNaN(userNum)) {
            return false;
        }

        this.correctAnswer = this.generateCorrectAnswer();

        console.log(`Calculated Answer: ${this.correctAnswer}`);

        const expectedAnswer = this.roundValue(this.correctAnswer, this.roundTo, this.roundType);
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
    public quizAnswers: Record<string, QuizAnswerStats> = {};
    public sessionsByCategory = new Map<string, QuizSession>();

    constructor() {}

    public applyApp(loaded: AppPreferences): void {
        // if (loaded.quizAnswers) {
        //     this.quizAnswers = loaded.quizAnswers;
        // }
    }

    public registerAnswer(topic: string, category: string, correct: boolean): void {
        const key = `${topic}::${category}`;
        const stats = this.quizAnswers[key] ?? { attempts: 0, correct: 0 };

        stats.attempts++;
        if (correct) {
            stats.correct++;
        }

        this.quizAnswers[key] = stats;
    }

    public initializeStats(): void {
        for (const topic of this.topics) {
            for (const category of topic.categories) {
                const key = `${topic.topic}::${category.name}`;
                if (!this.quizAnswers[key]) {
                    this.quizAnswers[key] = { attempts: 0, correct: 0 };
                }
            }
        }
    }

    public hasPassedCategory(topic: string, category: string): boolean {
        const key = `${topic}::${category}`;

        if (!this.quizAnswers) {
            return false;
        }
        const stats = this.quizAnswers[key];
        return stats ? this.isQuizCompleted(stats) : false;
    }

    public countFinishedCategories(topic: Topic): number {
        return topic.categories.filter(cat =>
            this.hasPassedCategory(topic.topic, cat.name)
        ).length;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        const finished = this.countFinishedCategories(topic);
        const total = topic.categories.length;
        const color = finished === total ? 'bg-success' : 'bg-warning';
        return { finished, total, color };
    }

    public isQuizCompleted(quizAnswers: QuizAnswerStats): boolean {
        return !!quizAnswers && quizAnswers.attempts >= QuizSession.requiredAnsweredCount
            && (quizAnswers.correct / quizAnswers.attempts) * 100 >= QuizSession.minimalAcceptableSuccessRate;
    }
}

// const isValid = Precision.isInRange(value, min, max);
// kumulativni prumer
// pokusu  = 10 , aktualini prumer 0.7
// prumer = (10 * 0.7 + novaodpoved) / (10 + 1), pokusy + 1
// spatne = 0b, s napovdedou = 1 (0.5), bez napovedy spravne  = 2 (1)
// help pokud spocital spatne
