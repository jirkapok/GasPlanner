import { QuizItem } from './quiz.service';
import { DepthConverter, NitroxCalculator, SacCalculator, GasProperties } from 'scuba-physics';

export type VariableOption = number;

export enum RoundType {
    round = 'round',
    floor = 'floor',
    ceil = 'ceil'
}

export class Variable {
    constructor(
        public name: string,
        public options?: VariableOption[],
        public min?: number,
        public max?: number
    ) {}

    public randomizeVariable(): number {
        if (typeof this.min === 'number' && typeof this.max === 'number') {
            const min = this.min;
            const max = this.max;
            const decimals = Math.max(
                (min.toString().split('.')[1]?.length || 0),
                (max.toString().split('.')[1]?.length || 0)
            );

            const randomValue = Math.random() * (max - min) + min;
            return parseFloat(randomValue.toFixed(decimals));
        } else if (Array.isArray(this.options)) {
            const randomIndex = Math.floor(Math.random() * this.options.length);
            return this.options[randomIndex];
        }
        return 1;
    }
}

export interface QuizItemTools {
    depthConverter: DepthConverter;
    nitroxCalculator: NitroxCalculator;
    sacCalculator: SacCalculator;
    gasProperties: GasProperties;
}

export class QuestionTemplate {
    constructor(
        public question: string,
        public roundTo: number,
        public roundType: RoundType,
        public variables: Variable[],
        public calculateAnswer: (variables: number[], tools: QuizItemTools) => number
    ) {}
}

export class Category {
    constructor(
        public name: string,
        public help: string,
        public questions: QuestionTemplate[]
    ) {}

    public getQuizItemForCategory(): QuizItem {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        const selectedTemplate = this.questions[randomIndex];
        return new QuizItem(selectedTemplate, this.name);
    }
}

export class Topic {
    constructor(
        public topic: string,
        public categories: Category[]
    ) {}
}
