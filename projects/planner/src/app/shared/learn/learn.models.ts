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
}

export class QuestionTemplate {
    constructor(
        public question: string,
        public roundTo: number,
        public roundType: RoundType,
        public variables: Variable[]
    ) {}
}

export class Category {
    constructor(
        public name: string,
        public help: string,
        public questions: QuestionTemplate[]
    ) {}
}

export class Topic {
    constructor(
        public topic: string,
        public categories: Category[]
    ) {}
}

export const topics: Topic[] = [
    new Topic('Nitrox', [
        new Category('Maximum operational depth', 'nitrox', [
            new QuestionTemplate(
                'What is maximum operational depth for gas with {o2_percent}% oxygen at partial pressure {pp} ?',
                0,
                RoundType.floor,
                [
                    new Variable('pp', undefined, 0.21, 2.91),
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100])
                ]
            )
        ]),
        new Category('Best mix', 'nitrox', [
            new QuestionTemplate(
                'What is best mix (in percents) at partial pressure {pp} at depth {depth} m?',
                0,
                RoundType.round,
                [
                    new Variable('pp', undefined, 0.21, 2.91),
                    new Variable('depth', undefined, 0, 350)
                ]
            )
        ]),
        new Category('Partial pressure', 'nitrox', [
            new QuestionTemplate(
                'What is partial pressure of {o2_percent}% at {depth} m?',
                1,
                RoundType.round,
                [
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100]),
                    new Variable('depth', undefined, 0, 350)
                ]
            )
        ])
    ]),

    new Topic('Consumption', [
        new Category('Respiratory minute volume', 'sac', [
            new QuestionTemplate(
                'What is respiratory minute volume of dive to average depth {depth} m, with tank {tank_size} L for {time} minutes ' +
                'where diver consumed {consumed_pressure} b?',
                0,
                RoundType.round,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', undefined, 10, 18),
                    new Variable('consumed_pressure', undefined, 100, 200),
                    new Variable('time', undefined, 30, 60)
                ]
            )
        ])
    ])
];
