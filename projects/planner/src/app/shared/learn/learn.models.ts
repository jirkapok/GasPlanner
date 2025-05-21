import { QuizItem } from './quiz-item.model';
import { DepthConverter, NitroxCalculator, SacCalculator, GasProperties } from 'scuba-physics';

export type VariableOption = number;

export enum RoundType {
    round = 'round',
    floor = 'floor',
    ceil = 'ceil'
}

export interface Variable {
    name: string;
    randomizeVariable(): number;
}

export class NumberVariable implements Variable {
    constructor(
        public name: string,
        public min: number,
        public max: number
    ) {}

    public randomizeVariable(): number {
        const decimals = Math.max(
            (this.min.toString().split('.')[1]?.length || 0),
            (this.max.toString().split('.')[1]?.length || 0)
        );

        const randomValue = Math.random() * (this.max - this.min) + this.min;
        return parseFloat(randomValue.toFixed(decimals));
    }
}

export class OptionsVariable implements Variable {
    constructor(
        public name: string,
        private options: VariableOption[]
    ) {}

    public randomizeVariable(): number {
        const randomIndex = Math.floor(Math.random() * this.options.length);
        return this.options[randomIndex];
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
        return new QuizItem(selectedTemplate);
    }
}

export class Topic {
    constructor(
        public topic: string,
        public categories: Category[]
    ) {}


    public static getEmptyCategory(): Category {
        return new Category('newCat', 'readme', []);
    }

    public getCategoryByNameOrEmpty(categoryName: string): Category {
        if (this.categories.length > 0) {
            const category = this.categories.find(c => c.name === categoryName);
            if (category) {
                return category;
            }
        }
        return Topic.getEmptyCategory();
    }
}
