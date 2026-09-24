import {
    Category,
    QuestionTemplate,
    RoundType,
    Topic,
    NumberVariable,
    OptionsVariable
} from './learn.models';
import { DepthConverter, GasProperties, NitroxCalculator, SacCalculator } from "scuba-physics";

const depthConverter = DepthConverter.simple();
const nitroxCalculator = new NitroxCalculator(depthConverter, 0.21);
const sacCalculator = new SacCalculator(depthConverter);
const gasProperties = new GasProperties();

export const topics: Topic[] = [
    new Topic('learn.topics.pressureAtDepth', [
        new Category('learn.categories.examples_depth', 'examples_depth', [
            new QuestionTemplate(
                'learn.questions.examples_depth',
                1,
                RoundType.round,
                [
                    new NumberVariable('pressure', 1, 11, 1)
                ],
                (vars: number[]) => depthConverter.fromBar(vars[0])
            )
        ]),
        new Category('learn.categories.examples_pressure', 'examples_pressure', [
            new QuestionTemplate(
                'learn.questions.examples_pressure',
                1,
                RoundType.round,
                [
                    new NumberVariable('depth', 0, 100, 0)
                ],
                (vars: number[]) => depthConverter.toBar(vars[0])
            )
        ]),
    ]),

    new Topic('learn.topics.nitrox', [
        new Category('learn.categories.examples_mod', 'examples_mod', [
            new QuestionTemplate(
                'learn.questions.examples_mod',
                0,
                RoundType.floor,
                [
                    new NumberVariable('pp', 1, 1.6, 1),
                    new OptionsVariable('o2_percent', [21, 32, 36, 38, 50, 100])
                ],
                (vars: number[]) => nitroxCalculator.mod(vars[0], vars[1])
            )
        ]),
        new Category('learn.categories.examples_bestmix', 'examples_bestmix', [
            new QuestionTemplate(
                'learn.questions.examples_bestmix',
                0,
                RoundType.floor,
                [
                    new NumberVariable('pp', 1, 1.6, 1),
                    new NumberVariable('depth', 6, 36)
                ],
                (vars: number[]) => nitroxCalculator.bestMix(vars[0], vars[1])
            )
        ]),
        new Category('learn.categories.examples_ppO2', 'examples_ppO2', [
            new QuestionTemplate(
                'learn.questions.examples_ppO2',
                2,
                RoundType.round,
                [
                    new NumberVariable('o2_percent', 21, 36,),
                    new NumberVariable('depth', 1, 34)
                ],
                (vars: number[]) => nitroxCalculator.partialPressure(vars[0], vars[1])
            )
        ]),
        new Category('learn.categories.examples_ead', 'examples_ead', [
            new QuestionTemplate(
                'learn.questions.examples_ead',
                0,
                RoundType.ceil,
                [
                    new NumberVariable('o2_percent', 21, 36),
                    new NumberVariable('depth', 10, 34)
                ],
                (vars: number[]) => nitroxCalculator.ead(vars[0], vars[1])
            )
        ]),
    ]),

    new Topic('learn.topics.consumption', [
        new Category('learn.categories.examples_sac', 'examples_sac', [
            new QuestionTemplate(
                'learn.questions.examples_sac',
                1,
                RoundType.ceil,
                [
                    new NumberVariable('rmv', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24])
                ],
                (vars: number[]) => vars[0]/ vars[1]
            )
        ]),
        new Category('learn.categories.examples_rmv', 'examples_rmv', [
            new QuestionTemplate(
                'learn.questions.examples_rmv',
                1,
                RoundType.ceil,
                [
                    new NumberVariable('depth', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new NumberVariable('consumed', 50, 150),
                    new NumberVariable('duration', 30, 60)
                ],
                (vars: number[]) => sacCalculator.calculateRmv(vars[0], vars[1], vars[2], vars[3])
            )
        ]),
        new Category('learn.categories.examples_consumed', 'examples_consumed', [
            new QuestionTemplate(
                'learn.questions.examples_consumed',
                0,
                RoundType.ceil,
                [
                    new NumberVariable('depth', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new NumberVariable('duration', 30, 60),
                    new NumberVariable('rmv', 15, 25)
                ],
                (vars: number[]) => sacCalculator.calculateUsed(vars[0], vars[1], vars[2], vars[3])
            )
        ]),
        new Category('learn.categories.examples_durationbyrmv', 'examples_durationbyrmv', [
            new QuestionTemplate(
                'learn.questions.examples_durationbyrmv',
                0,
                RoundType.floor,
                [
                    new NumberVariable('depth', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new NumberVariable('consumed', 30, 150),
                    new NumberVariable('rmv', 15, 25)
                ],
                (vars: number[]) => sacCalculator.calculateDuration(vars[0], vars[1], vars[2], vars[3])
            )
        ])
    ]),

    new Topic('learn.topics.trimix', [
        new Category('learn.categories.examples_mindepth', 'examples_mindepth', [
            new QuestionTemplate(
                'learn.questions.examples_mindepth',
                0,
                RoundType.ceil,
                [
                    new NumberVariable('oxygen', 10, 21),
                    new NumberVariable('helium', 20, 70)
                ],
                (vars: number[]) => {
                    gasProperties.maxPpO2 = 0.18;
                    gasProperties.tank.o2 = vars[0];
                    gasProperties.tank.he = vars[1];
                    return gasProperties.minDepth;
                }
            )
        ]),
        new Category('learn.categories.examples_end', 'examples_end', [
            new QuestionTemplate(
                'learn.questions.examples_end',
                0,
                RoundType.ceil,
                [
                    new NumberVariable('oxygen', 10, 21),
                    new NumberVariable('helium', 10, 30),
                    new NumberVariable('depth', 10, 80)
                ],
                (vars: number[]) => {
                    gasProperties.tank.o2 = vars[0];
                    gasProperties.tank.he = vars[1];
                    gasProperties.depth = vars[2];
                    return gasProperties.end;
                }
            )
        ]),
        new Category('learn.categories.examples_mnd', 'examples_mnd', [
            new QuestionTemplate(
                'learn.questions.examples_mnd',
                0,
                RoundType.floor,
                [
                    new NumberVariable('oxygen', 10, 21),
                    new NumberVariable('helium', 20, 70),
                    new OptionsVariable('narc_depth', [30, 40]),
                ],
                (vars: number[]) => {
                    gasProperties.tank.o2 = vars[0];
                    gasProperties.tank.he = vars[1];
                    gasProperties.narcoticDepthLimit = vars[2];
                    return gasProperties.mnd;
                }
            )
        ])
    ])

    // Consider add learn topics:
    // * Partial pressures - oxygen, nitrogen, helium, total
    // * Oxygen toxicity CNS/OTU using simplified table based text book formula
];
