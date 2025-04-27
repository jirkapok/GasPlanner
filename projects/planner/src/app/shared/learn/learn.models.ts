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
                'What is maximum operational depth for gas with {o2_percent} % oxygen at partial pressure {pp} ?',
                0,
                RoundType.floor,
                [
                    new Variable('pp', undefined, 1, 2),
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
                    new Variable('pp', undefined, 1, 2),
                    new Variable('depth', undefined, 1, 50)
                ]
            )
        ]),
        new Category('Partial pressure', 'nitrox', [
            new QuestionTemplate(
                'What is partial pressure of {o2_percent} % at {depth} m?',
                1,
                RoundType.round,
                [
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100]),
                    new Variable('depth', undefined, 1, 50)
                ]
            )
        ]),
        new Category('Equivalent air depth', 'nitrox', [
            new QuestionTemplate(
                'What is the equivalent air depth of {o2_percent} % at {depth} m?',
                1,
                RoundType.round,
                [
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100]),
                    new Variable('depth', undefined, 1, 50)
                ]
            )
        ]),
    ]),

    new Topic('Consumption', [
        new Category('Respiratory minute volume', 'sac', [
            new QuestionTemplate(
                'What is respiratory minute volume (RMV in liters per minute) of dive to average depth {depth} m, ' +
                'with tank {tank_size} L for {time} minutes where diver consumed {consumed} b?',
                0,
                RoundType.round,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 50, 200),
                    new Variable('time', undefined, 30, 60)
                ]
            )
        ]),
        new Category('Used gas', 'sac', [
            new QuestionTemplate(
                'How much gas did i use (in bars) at average depth {depth} m, with tank {tank_size} L for {time} minutes ' +
                'where my respiratory minute volume (RMV) was {rmv} b?',
                0,
                RoundType.round,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('time', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ]
            )
        ]),
        new Category('Dive duration', 'sac', [
            new QuestionTemplate(
                'How long can i stay (in minutest) at average depth {depth} m with available {consumed} in {tank_size} L tank, ' +
                'where my respiratory minute volume (RMV) is {rmv} b?',
                0,
                RoundType.round,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ]
            )
        ])

        // TODO fix help topics and generate md files for the questions
        // TODO fix rounding tipes for each question and result precission
        // TODO add EAD to gas properties calculator in case Helium is 0 %
        // TODO add Learn topics:
        // * Unit conversions: Depth <-> pressure conversions
        // * partial pressures - oxygen, nitrogen, helium, total
        // * Trimix - Maximum narcotic depth, Equivalent narcotic depth, Maximum operational depth, minimum operational depth
        // Consider oxygen toxicity CNS/OTU using simplified table based text book formula
    ])
];
