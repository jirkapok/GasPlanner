import {
    Precision
} from 'scuba-physics';
import { QuestionTemplate, RoundType } from './learn.models';

export class QuizItem {
    public correctAnswer?: number;

    public roundTo: number;
    public roundType: RoundType;
    public variables: number[] = [];
    public isAnswered = false;
    public isCorrect = false;

    /** bound directly to UI */
    public userAnswer?: string;
    public renderedQuestion = '';

    constructor(private template: QuestionTemplate) {
        this.roundTo = template.roundTo;
        this.roundType = template.roundType;
        this.randomizeQuizVariables();
        this.renderQuestion();
        this.generateCorrectAnswer();
    }

    public validateAnswer(): boolean {
        const userAns = (this.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (Number.isNaN(userNum)) {
            return false;
        }

        const userAnswerRounded = this.roundValue(userNum, this.roundTo, this.roundType);
        return userAnswerRounded === this.correctAnswer;
    }

    private randomizeQuizVariables(): void {
        this.variables = this.template.variables.map(variable => variable.nextRandomValue());
    }

    private generateCorrectAnswer(): void {
        const expected = this.template.calculateAnswer(this.variables);
        this.correctAnswer = this.roundValue(expected, this.roundTo, this.roundType);
    }

    private renderQuestion(): void {
        let rendered = this.template.question;
        if (Array.isArray(this.template.variables)) {
            this.template.variables.forEach((variable, index) => {
                rendered = rendered.replace(new RegExp(`{${variable.name}}`, 'g'), this.variables[index].toString());
            });
        }
        this.renderedQuestion = rendered;
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
