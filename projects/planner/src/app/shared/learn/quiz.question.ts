import {
    Precision
} from 'scuba-physics';
import { QuestionTemplate, RoundType } from './learn.models';

export class Question {
    /** bound directly to UI */
    public userAnswer?: string;
    public readonly roundTo: number;
    public readonly roundType: RoundType;
    public renderedQuestion: string;
    public readonly correctAnswer: number;
    private readonly variables: number[];
    private _isAnswered = false;
    private _isCorrect = false;

    constructor(private template: QuestionTemplate, private questionText: string = template.question) {
        this.roundTo = template.roundTo;
        this.roundType = template.roundType;
        this.variables = this.randomizeQuizVariables();
        this.renderedQuestion = this.renderQuestion();
        this.correctAnswer = this.generateCorrectAnswer();
    }

    /** Translation key of the question template, so the UI can re-resolve it on language change. */
    public get templateKey(): string {
        return this.template.question;
    }

    public get isAnswered(): boolean {
        return this._isAnswered;
    }

    public get isCorrect(): boolean {
        return this._isCorrect;
    }

    /** Re-renders the question text in a newly resolved language, keeping the same randomized variables/answer. */
    public retranslate(questionText: string): void {
        this.questionText = questionText;
        this.renderedQuestion = this.renderQuestion();
    }

    public validateAnswer(): void {
        this._isAnswered = true;
        const userAns = (this.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (Number.isNaN(userNum)) {
            return;
        }

        const userAnswerRounded = this.roundValue(userNum, this.roundTo, this.roundType);
        this._isCorrect = userAnswerRounded === this.correctAnswer;
    }

    private randomizeQuizVariables(): number[] {
        return this.template.variables.map(variable => variable.nextRandomValue());
    }

    private generateCorrectAnswer(): number {
        const expected = this.template.calculateAnswer(this.variables);
        return this.roundValue(expected, this.roundTo, this.roundType);
    }

    private renderQuestion(): string {
        let rendered = this.questionText;
        this.template.variables.forEach((variable, index) => {
            rendered = rendered.replace(new RegExp(`{${variable.name}}`, 'g'), this.variables[index].toString());
        });
        return rendered;
    }

    private roundValue(value: number, roundTo: number, roundType: RoundType): number {
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
}
