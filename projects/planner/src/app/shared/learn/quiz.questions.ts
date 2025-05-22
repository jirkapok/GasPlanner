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
    new Topic('Pressure at depth', [
        new Category('Depth', 'examples_depth', [
            new QuestionTemplate(
                'What is the depth (in meters) at which the ambient pressure is {pressure} bar?',
                1,
                RoundType.round,
                [
                    new NumberVariable('pressure', 1, 11, 1)
                ],
                (vars: number[]) => depthConverter.fromBar(vars[0])
            )
        ]),
        new Category('Pressure', 'examples_pressure', [
            new QuestionTemplate(
                'What is the ambient pressure in bars at depth {depth} meters?',
                1,
                RoundType.round,
                [
                    new NumberVariable('depth', 0, 100, 0)
                ],
                (vars: number[]) => depthConverter.toBar(vars[0])
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
                    new NumberVariable('pp', 1, 1.6, 1),
                    new OptionsVariable('o2_percent', [21, 32, 36, 38, 50, 100])
                ],
                (vars: number[]) => nitroxCalculator.mod(vars[0], vars[1])
            )
        ]),
        new Category('Best mix', 'examples_bestmix', [
            new QuestionTemplate(
                'What is best mix (in percents) at partial pressure {pp} at depth {depth} m?',
                0,
                RoundType.floor,
                [
                    new NumberVariable('pp', 1, 1.6, 1),
                    new NumberVariable('depth', 6, 36)
                ],
                (vars: number[]) => nitroxCalculator.bestMix(vars[0], vars[1])
            )
        ]),
        new Category('Oxygen partial pressure', 'examples_ppO2', [
            new QuestionTemplate(
                'What is partial pressure of {o2_percent} % at {depth} m?',
                2,
                RoundType.round,
                [
                    new NumberVariable('o2_percent', 21, 36,),
                    new NumberVariable('depth', 1, 34)
                ],
                (vars: number[]) => nitroxCalculator.partialPressure(vars[0], vars[1])
            )
        ]),
        new Category('Equivalent air depth', 'examples_ead', [
            new QuestionTemplate(
                'What is the equivalent air depth of nitrox mix with {o2_percent} % oxygen at {depth} m?',
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

    new Topic('Consumption', [
        new Category('Surface air consumption', 'examples_sac', [
            new QuestionTemplate(
                'My respiratory minute volume (RMV in liters per minute) is {rmv} L/min. ' +
                'What is my surface air consumption (SAC) when breathing from {tank_size} L tank?',
                1,
                RoundType.ceil,
                [
                    new NumberVariable('rmv', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24])
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
                    new NumberVariable('depth', 10, 30),
                    new OptionsVariable('tank_size', [7, 8, 10, 11, 12, 15, 18, 24]),
                    new NumberVariable('consumed', 50, 150),
                    new NumberVariable('duration', 30, 60)
                ],
                (vars: number[]) => sacCalculator.calculateRmv(vars[0], vars[1], vars[2], vars[3])
            )
        ]),
        new Category('Used gas', 'examples_consumed', [
            new QuestionTemplate(
                'How much gas did i use (in bars) at average depth {depth} m, with tank {tank_size} L for {duration} ' +
                'minutes where my respiratory minute volume (RMV) was {rmv} L/min?',
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
        new Category('Dive duration', 'examples_durationbyrmv', [
            new QuestionTemplate(
                'How long can i stay (in minutes) at average depth {depth} m with available {consumed} in {tank_size} L tank, ' +
                'where my respiratory minute volume (RMV) is {rmv} L/min?',
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

    new Topic('Trimix', [
        new Category('Minimum depth', 'examples_mindepth', [
            new QuestionTemplate(
                'Team selects Trimix {oxygen}/{helium} as a gas for a dive. ' +
                'Minimum partial pressure of oxygen (ppO2) is 0.18 b. What is the minimum depth for this gas?',
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
        new Category('Equivalent narcotic depth', 'examples_end', [
            new QuestionTemplate(
                'You plan a dive to {depth} meters. ' +
                'Oxygen is considered as narcotic. ' +
                'Team selects Trimix {oxygen}/{helium} as a gas for the dive. What is the equivalent narcotic depth for this gas?',
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
        new Category('Maximum narcotic depth', 'examples_mnd', [
            new QuestionTemplate(
                'You plan a dive and consider Air narcotic for depths below {narc_depth} meters. ' +
                'Oxygen is considered as narcotic. ' +
                'Team selects Trimix {oxygen}/{helium} as a gas. What is the maximum narcotic depth for this gas?',
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

    // TODO fix help links for options and dive info.
    // Consider add learn topics:
    // * Partial pressures - oxygen, nitrogen, helium, total
    // * Oxygen toxicity CNS/OTU using simplified table based text book formula
];
