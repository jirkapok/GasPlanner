import { Question } from './quiz.question';
import {
    Precision
} from 'scuba-physics';

export type VariableOption = number;

export enum RoundType {
    round = 'round',
    floor = 'floor',
    ceil = 'ceil'
}

export interface Variable {
    name: string;
    nextRandomValue(): number;
}

export class NumberVariable implements Variable {
    constructor(
        public name: string,
        public min: number,
        public max: number,
        private decimals: number = 0
    ) {}

    public nextRandomValue(): number {
        const randomValue = Math.random() * (this.max - this.min) + this.min;
        const rounded =  Precision.round(randomValue, this.decimals);

        if (rounded > this.max) {
            return this.max;
        }

        if (rounded < this.min) {
            return this.min;
        }

        return rounded;
    }
}

export class OptionsVariable implements Variable {
    constructor(
        public name: string,
        private options: VariableOption[]
    ) {}

    public nextRandomValue(): number {
        const randomIndex = Math.floor(Math.random() * this.options.length);
        return this.options[randomIndex];
    }
}

export class QuestionTemplate {
    constructor(
        public question: string,
        public roundTo: number,
        public roundType: RoundType,
        public variables: Variable[],
        public calculateAnswer: (variables: number[]) => number
    ) {}
}

export class Category {
    constructor(
        public name: string,
        public help: string,
        public questions: QuestionTemplate[]
    ) {}

    public createQuestion(): Question {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        const selectedTemplate = this.questions[randomIndex];
        return new Question(selectedTemplate);
    }
}

export class Topic {
    constructor(
        public name: string,
        public categories: Category[]
    ) {}
}
