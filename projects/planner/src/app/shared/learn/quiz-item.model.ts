import {
    NitroxCalculator, SacCalculator, DepthConverter,
    Precision, GasProperties
} from 'scuba-physics';
import { QuestionTemplate, RoundType } from './learn.models';

export class QuizItem {
    public correctAnswer?: number;

    public roundTo: number;
    public roundType: RoundType;
    public variables: number[] = [];
    public isAnswered = false;
    public isCorrect = false;
    public userAnswer?: string;
    public renderedQuestion = '';

    constructor(private template: QuestionTemplate) {
        this.roundTo = template.roundTo;
        this.roundType = template.roundType;
        this.randomizeQuizVariables();
        this.renderQuestion();
    }

    public randomizeQuizVariables(): void {
        let indexSafe = 0;

        do {
            this.variables = this.template.variables.map(variable => variable.nextRandomValue());
            indexSafe++;
            // TODO If this happens, it means that the question definition variables are incorrect.
        } while (Number.isNaN(this.generateCorrectAnswer()) && indexSafe < 100);
    }

    // TODO make private
    public generateCorrectAnswer(): number {
        if (typeof this.template.calculateAnswer === 'function') {
            return this.template.calculateAnswer(this.variables);
        }

        throw new Error('Invalid question template: missing calculateAnswer');
    }

    // TODO validateAnswer with user provided value
    public validateAnswer(): boolean {
        const userAns = (this.userAnswer || '').trim();
        const userNum = parseFloat(userAns);

        if (Number.isNaN(userNum)) {
            return false;
        }

        const expected = this.generateCorrectAnswer();
        this.correctAnswer = this.roundValue(expected, this.roundTo, this.roundType);
        const userAnswerRounded = this.roundValue(userNum, this.roundTo, this.roundType);

        return userAnswerRounded === this.correctAnswer;
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
