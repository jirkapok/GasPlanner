import { Category, QuestionTemplate, RoundType, Topic, Variable, QuizItemTools } from './learn.models';

export const topics: Topic[] = [
    new Topic('Pressure at depth', [
        new Category('Depth', 'examples_depth', [
            new QuestionTemplate(
                'What is the depth (in meters) at which the ambient pressure is {pressure} bar?',
                1,
                RoundType.round,
                [
                    new Variable('pressure', undefined, 1, 11)
                ],
                (vars: number[], tools: QuizItemTools) => tools.depthConverter.fromBar(vars[0])
            )
        ]),
        new Category('Pressure', 'examples_pressure', [
            new QuestionTemplate(
                'What is the ambient pressure in bars at depth {depth} meters?',
                1,
                RoundType.round,
                [
                    new Variable('depth', undefined, 0, 100)
                ],
                (vars: number[], tools: QuizItemTools) => tools.depthConverter.toBar(vars[0])
            )
        ]),
    ]),

    new Topic('Nitrox', [
        new Category('Maximum operational depth', 'examples_mod', [
            new QuestionTemplate(
                'What is maximum operational depth for gas with {o2_percent} % oxygen at partial pressure {pp} ?',
                0,
                RoundType.floor,
                [
                    new Variable('pp', undefined, 1, 2),
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100])
                ],
                (vars: number[], tools: QuizItemTools) => tools.nitroxCalculator.mod(vars[0], vars[1] / 100)
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
                ],
                (vars: number[], tools: QuizItemTools) => tools.nitroxCalculator.bestMix(vars[1], vars[0]) * 100
            )
        ]),
        new Category('Oxygen partial pressure', 'examples_ppO2', [
            new QuestionTemplate(
                'What is partial pressure of {o2_percent} % at {depth} m?',
                1,
                RoundType.round,
                [
                    new Variable('o2_percent', [21, 32, 36, 38, 50, 100]),
                    new Variable('depth', undefined, 1, 50)
                ],
                (vars: number[], tools: QuizItemTools) => tools.nitroxCalculator.partialPressure(vars[0] / 100, vars[1])
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
                ],
                (vars: number[], tools: QuizItemTools) => tools.nitroxCalculator.ead(vars[1], vars[0] / 100)
            )
        ]),
    ]),

    new Topic('Consumption', [
        new Category('Surface air consumption', 'examples_sac', [
            new QuestionTemplate(
                'My respiratory minute volume (RMV in liters per minute) is {rmv} L/min. ' +
                'What is my surface air consumption (SAC) when breathing from {tank_size} L tank?',
                1,
                RoundType.ceil,
                [
                    new Variable('rmv', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24])
                ],
                (vars: number[]) => vars[0]/ vars[1]
            )
        ]),
        new Category('Respiratory minute volume', 'examples_rmv', [
            new QuestionTemplate(
                'What is respiratory minute volume (RMV in liters per minute) of dive to average depth {depth} m, ' +
                'with tank {tank_size} L for {duration} minutes where diver consumed {consumed} b?',
                1,
                RoundType.ceil,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 50, 200),
                    new Variable('duration', undefined, 30, 60)
                ],
                (vars: number[], tools: QuizItemTools) => tools.sacCalculator.calculateRmv(vars[0], vars[1], vars[2], vars[3])
            )
        ]),
        new Category('Used gas', 'examples_consumed', [
            new QuestionTemplate(
                'How much gas did i use (in bars) at average depth {depth} m, with tank {tank_size} L for {duration} ' +
                'minutes where my respiratory minute volume (RMV) was {rmv} L/min?',
                0,
                RoundType.ceil,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('duration', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ],
                (vars: number[], tools: QuizItemTools) => tools.sacCalculator.calculateUsed(vars[0], vars[1], vars[2], vars[3])
            )
        ]),
        new Category('Dive duration', 'examples_durationbyrmv', [
            new QuestionTemplate(
                'How long can i stay (in minutes) at average depth {depth} m with available {consumed} in {tank_size} L tank, ' +
                'where my respiratory minute volume (RMV) is {rmv} L/min?',
                0,
                RoundType.floor,
                [
                    new Variable('depth', undefined, 10, 30),
                    new Variable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new Variable('consumed', undefined, 30, 60),
                    new Variable('rmv', undefined, 15, 25)
                ],
                (vars: number[], tools: QuizItemTools) => tools.sacCalculator.calculateDuration(vars[0], vars[1], vars[2], vars[3])
            )
        ])
    ]),

    new Topic('Trimix', [
        new Category('Minimum depth', 'examples_mindepth', [
            new QuestionTemplate(
                'Team selects Trimix {oxygen}/{helium} as a gas for a dive. ' +
                'Minimum partial pressure of oxygen (ppO2) is 0.18 b. What is the minimum depth for this gas?',
                0,
                RoundType.ceil,
                [
                    new Variable('oxygen', undefined, 10, 21),
                    new Variable('helium', undefined, 20, 70)
                ],
                (vars: number[], tools: QuizItemTools) => {
                    tools.gasProperties.maxPpO2 = 0.18;
                    return tools.gasProperties.minDepth;
                }
            )
        ]),
        new Category('Equivalent narcotic depth', 'examples_end', [
            new QuestionTemplate(
                'You plan a dive to {depth} meters. ' +
                'Team selects Trimix {oxygen}/{helium} as a gas for the dive. What is the equivalent narcotic depth for this gas?',
                0,
                RoundType.ceil,
                [
                    new Variable('oxygen', undefined, 10, 21),
                    new Variable('helium', undefined, 10, 30),
                    new Variable('depth', undefined, 10, 80)
                ],
                (vars: number[], tools: QuizItemTools) => {
                    tools.gasProperties.depth = vars[2];
                    return tools.gasProperties.end;
                }
            )
        ]),
        new Category('Maximum narcotic depth', 'examples_mnd', [
            new QuestionTemplate(
                'You plan a dive and consider Air narcotic for depths below 30 meters. ' +
                'Team selects Trimix {oxygen}/{helium} as a gas. What is the maximum narcotic depth for this gas?',
                0,
                RoundType.floor,
                [
                    new Variable('oxygen', undefined, 10, 21),
                    new Variable('helium', undefined, 20, 70)
                ],
                (vars: number[], tools: QuizItemTools) => {
                    tools.gasProperties.narcoticDepthLimit = vars[0];
                    tools.gasProperties.depth = vars[1];
                    return tools.gasProperties.mnd;
                }
            )
        ])
    ])

    // TODO fix help links for options and dive info.
    // TODO consider reuse questions from one topic in another (e.g. MOD or oxygen partial pressure)
    // TODO Consider add learn topics:
    // * Partial pressures - oxygen, nitrogen, helium, total
    // * Oxygen toxicity CNS/OTU using simplified table based text book formula
];
