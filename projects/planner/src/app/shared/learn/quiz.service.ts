import { Injectable } from '@angular/core';
import {
    NitroxCalculator, SacCalculator, DepthConverter,
    Precision, GasProperties
} from 'scuba-physics';
import { Topic, QuestionTemplate, RoundType, QuizItemTools } from './learn.models';
import { QuizSession } from './quiz-session.model';
import { topics } from './quiz.questions';
import { AppPreferences, SerializableQuizSession } from '../serialization.model';
import { HelpModalComponent } from '../../help-modal/help-modal.component';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

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
        public template: QuestionTemplate
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
        const expectedAnswer = this.roundValue(this.correctAnswer, this.roundTo, this.roundType);
        const userAnswerRounded = this.roundValue(userNum, this.roundTo, this.roundType);

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
    public sessionsByCategory = new Map<string, QuizSession>();
    public quizWelcomeWasShown = false;

    constructor(
        private modalService: MdbModalService
    ) {}

    public applyApp(loaded: AppPreferences): void {

        this.sessionsByCategory.clear();

        this.quizWelcomeWasShown = loaded.quizWelcomeWasShown;

        if (!this.quizWelcomeWasShown) {
            this.quizWelcomeWasShown = true;
            this.modalService.open(HelpModalComponent, {
                data: { path: 'learn-welcome' }
            });
        }
    }

    public countGainedTrophies(topic: Topic): number {
        let count = 0;
        for (const category of topic.categories) {
            const key = category.name;
            if (this.sessionsByCategory.get(key)?.trophyGained) {
                count++;
            }
        }
        return count;
    }

    public getTopicCompletionStatus(topic: Topic): { finished: number; total: number; color: string } {
        const finished = this.countGainedTrophies(topic);
        const total = topic.categories.length;
        const color = finished === total ? 'bg-success' : 'bg-warning';
        return { finished, total, color };
    }

    public getSerializableSessions(): [string, SerializableQuizSession][] {
        const result: [string, SerializableQuizSession][] = [];

        for (const [key, session] of this.sessionsByCategory.entries()) {
            result.push([
                key,
                {
                    correctCount: session.correctCount,
                    totalAnswered: session.totalAnswered,
                    currentQuestionIndex: session.currentQuestionIndex,
                    finished: session.finished,
                    hintUsed: session.hintUsed,
                    totalScore: session.totalScore,
                    trophyGained: session.trophyGained
                }
            ]);
        }
        return result;
    }

    public restoreSessions(entries: [string, SerializableQuizSession][] | undefined): void {
        if (!Array.isArray(entries)) {
            return;
        }

        for (const [categoryName, value] of entries) {
            const category = this.topics
                .flatMap(topic => topic.categories)
                .find(c => c.name === categoryName);
            if (!category) {
                continue;
            }

            const quizzes = [category.getQuizItemForCategory()];
            const session = new QuizSession(quizzes, category);

            session.correctCount = value.correctCount;
            session.totalAnswered = value.totalAnswered;
            session.currentQuestionIndex = value.currentQuestionIndex;
            session.finished = value.finished;
            session.hintUsed = value.hintUsed;
            session.totalScore = value.totalScore;
            session.trophyGained = value.trophyGained;

            this.sessionsByCategory.set(categoryName, session);
        }
    }
}

// const isValid = Precision.isInRange(value, min, max);
// kumulativni prumer
// pokusu  = 10 , aktualini prumer 0.7
// prumer = (10 * 0.7 + novaodpoved) / (10 + 1), pokusy + 1
// spatne = 0b, s napovdedou = 1 (0.5), bez napovedy spravne  = 2 (1)
// help pokud spocital spatne
