import { Category, QuestionTemplate, RoundType, Topic, Variable } from "./learn.models";

export const topics: Topic[] = [
    new Topic('Nitrox', [
        new Category('Maximum operational depth', 'examples_mod', [
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
        new Category('Best mix', 'examples_bestmix', [
            new QuestionTemplate(
                'What is best mix (in percents) at partial pressure {pp} at depth {depth} m?',
                0,
                RoundType.floor,
                [
                    new Variable('pp', undefined, 1, 2),
                    new Variable('depth', undefined, 1, 50)
                ]
            )
        ]),
        new Category('Partial pressure', 'examples_ppO2', [
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
        new Category('Equivalent air depth', 'examples_ead', [
            new QuestionTemplate(
                'What is the equivalent air depth of nitrox mix with {o2_percent} % oxygen at {depth} m?',
                0,
                RoundType.ceil,
                [
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100]),
                    new Variable('depth', undefined, 1, 50)
                ]
            )
        ]),
    ]),

    new Topic('Consumption', [
        new Category('Respiratory minute volume', 'examples_consumed', [
            new QuestionTemplate(
                'What is respiratory minute volume (RMV in liters per minute) of dive to average depth {depth} m, ' +
                'with tank {tank_size} L for {time} minutes where diver consumed {consumed} b?',
                1,
                RoundType.ceil,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 50, 200),
                    new Variable('time', undefined, 30, 60)
                ]
            )
        ]),
        new Category('Used gas', 'examples_consumed', [
            new QuestionTemplate(
                'How much gas did i use (in bars) at average depth {depth} m, with tank {tank_size} L for {time} minutes ' +
                'where my respiratory minute volume (RMV) was {rmv} L/min?',
                0,
                RoundType.ceil,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('time', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ]
            )
        ]),
        new Category('Dive duration', 'examples_consumed', [
            new QuestionTemplate(
                'How long can i stay (in minutest) at average depth {depth} m with available {consumed} in {tank_size} L tank, ' +
                'where my respiratory minute volume (RMV) is {rmv} L/min?',
                0,
                RoundType.floor,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ]
            )
        ])

        // TODO fix help links for options and dive info.
        // TODO fix help topics and generate md files for the questions
        // TODO fix rounding types for each question and result precision
        // TODO add EAD to gas properties calculator in case Helium is 0 %
        // TODO add rounding type and precision to the question rendered text.
        // TODO add Learn topics:
        // * Unit conversions: Depth <-> pressure conversions
        // * partial pressures - oxygen, nitrogen, helium, total
        // * Trimix - Maximum narcotic depth, Equivalent narcotic depth, Maximum operational depth, minimum operational depth
        // * Consider oxygen toxicity CNS/OTU using simplified table based text book formula
    ])
];
