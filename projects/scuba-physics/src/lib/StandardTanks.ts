/**
 *  Unit dependent default cylinder values
 *  https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities
 */
class TankConstants {
    /** HP117 124 cuft tank as default single cylinder */
    public static readonly imperialTankSize = 124.1;

    /** HP117 3442 PSI default working pressure default single cylinder */
    public static readonly imperialTankWorkPressure = 3442;

    /** S80 cuft tank size for stage cylinder */
    public static readonly imperialStageSize = 80.1;

    /** S80 aluminum 3000 PSI default working pressure for stage cylinder */
    public static readonly imperialStageWorkPressure = 3000;

    /** 15L steel cylinder default single tank cylinder */
    public static readonly mertricTankSize = 15;

    /** S80 aluminum 11L cylinder default single tank cylinder */
    public static readonly metricStageSize = 11.1;
}


export interface TankTemplate {
    /** Common label of the cylinder */
    name: string;
    /** Ideal capacity in respective liters/cuft */
    size: number;
    /** in respective units bars/psi */
    workingPressure: number;
}

export interface StandardTanks {
    available: TankTemplate[];
    primary: TankTemplate;
    stage: TankTemplate;
}

export class ImperialTanks implements StandardTanks {
    public get available(): TankTemplate[] {
        return [
            this.primary,
            this.stage,
            {
                name: '2xLP85',
                size: 165,
                workingPressure: 2640,
            },
            {
                name: 'S40',
                size: 41.3,
                workingPressure: 3000,
            },
            {
                name: 'LP85',
                size: 82.5,
                workingPressure: 2640,
            },
            {
                name: 'HP80',
                size: 84.4,
                workingPressure: 3442,
            },
            {
                name: 'HP100',
                size: 106.7,
                workingPressure: 3442,
            }
        ];
    }

    public get primary(): TankTemplate {
        return {
            name: 'HP117',
            size: TankConstants.imperialTankSize,
            workingPressure: TankConstants.imperialTankWorkPressure,
        };
    }

    public get stage(): TankTemplate {
        return {
            name: 'S80',
            size: TankConstants.imperialStageSize,
            workingPressure: TankConstants.imperialStageWorkPressure,
        };
    }
}

export class MetricTanks implements StandardTanks {
    public get available(): TankTemplate[] {
        return [
            this.primary,
            this.stage,
            {
                name: '2x12 L',
                size: 24,
                workingPressure: 0,
            },
            {
                name: 'S40',
                size: 5.7,
                workingPressure: 0,
            },
            {
                name: '10L',
                size: 10,
                workingPressure: 0,
            },
            {
                name: '12 L',
                size: 12,
                workingPressure: 0,
            }
        ];
    }

    public get primary(): TankTemplate {
        return {
            name: '15 L',
            size: TankConstants.mertricTankSize,
            workingPressure: 0,
        };
    }

    public get stage(): TankTemplate {
        return {
            name: 'S80',
            size: TankConstants.metricStageSize,
            workingPressure: 0,
        };
    }
}
