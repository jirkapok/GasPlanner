import { TankConstants } from './StandardTanks';
import { OptionDefaults } from './Options';

/** Tank and depths default values, when creating new data in respective units */
export interface DefaultValues {
    primaryTankSize: number;
    primaryTankWorkPressure: number;
    stageTankSize: number;
    stageTankWorkPressure: number;

    /** Depth at which last speed change occurs */
    lastSpeedLevel: number;
    /** Depth at which we decide if safety stop is required */
    autoStopLevel: number;
    /** Distance defining stops during auto calculated ascent */
    stopsDistance: number;

    recreationalOptions: DefaultOptions;
    recommendedOptions: DefaultOptions;
}

export interface DefaultOptions {
    ascentSpeed50perc: number;
    ascentSpeed50percTo6m: number;
    ascentSpeed6m: number;
    descentSpeed: number;
    lastStopDepth: number;
    maxEND: number;
}

/** Default values of tanks and depths in metric system */
export class MetricDefaults implements DefaultValues {
    public get primaryTankSize(): number {
        return TankConstants.mertricTankSize;
    }

    public get primaryTankWorkPressure(): number {
        return 0;
    }

    public get stageTankSize(): number {
        return TankConstants.metricStageSize;
    }

    public get stageTankWorkPressure(): number {
        return 0;
    }

    public get lastSpeedLevel(): number {
        return 6;
    }

    public get autoStopLevel(): number {
        return 10;
    }

    public get stopsDistance(): number {
        return 3;
    }

    public get recreationalOptions(): DefaultOptions {
        return {
            ascentSpeed50perc: OptionDefaults.ascentSpeed50perc,
            ascentSpeed50percTo6m: OptionDefaults.ascentSpeed50perc,
            ascentSpeed6m: OptionDefaults.ascentSpeed50perc,
            descentSpeed: OptionDefaults.descentSpeed,
            lastStopDepth: OptionDefaults.lastStopDepthRecre,
            maxEND: OptionDefaults.maxEND
        };
    }

    public get recommendedOptions(): DefaultOptions {
        return {
            ascentSpeed50perc: OptionDefaults.ascentSpeed50perc,
            ascentSpeed50percTo6m: OptionDefaults.ascentSpeed50percTo6m,
            ascentSpeed6m:  OptionDefaults.ascentSpeed6m,
            descentSpeed: OptionDefaults.descentSpeed,
            lastStopDepth: OptionDefaults.lastStopDepth,
            maxEND: OptionDefaults.maxEND
        };
    }
}

/** Default values of tanks and depths in Imperial system */
export class ImperialDefaults implements DefaultValues {
    /** cca 4.5 m */
    private static readonly lastStopDepth = 15;
    private static readonly depthDistance = 10;
    private static readonly descentSpeed = ImperialDefaults.depthDistance * 6;
    private static readonly recreSpeed = ImperialDefaults.depthDistance * 3;
    private static readonly maxEnd = ImperialDefaults.depthDistance * 10;

    public get primaryTankSize(): number {
        return TankConstants.imperialTankSize;
    }

    public get primaryTankWorkPressure(): number {
        return TankConstants.imperialTankWorkPressure;
    }

    public get stageTankSize(): number {
        return TankConstants.imperialStageSize;
    }

    public get stageTankWorkPressure(): number {
        return TankConstants.imperialStageWorkPressure;
    }

    public get lastSpeedLevel(): number {
        return 20;
    }

    public get autoStopLevel(): number {
        return 33;
    }

    public get stopsDistance(): number {
        return ImperialDefaults.depthDistance;
    }

    public get recreationalOptions(): DefaultOptions {
        return {
            ascentSpeed50perc: ImperialDefaults.recreSpeed,
            ascentSpeed50percTo6m: ImperialDefaults.recreSpeed,
            ascentSpeed6m: ImperialDefaults.recreSpeed,
            descentSpeed: ImperialDefaults.descentSpeed,
            lastStopDepth: ImperialDefaults.lastStopDepth,
            maxEND: ImperialDefaults.maxEnd
        };
    }

    public get recommendedOptions(): DefaultOptions {
        return {
            ascentSpeed50perc: ImperialDefaults.recreSpeed,
            ascentSpeed50percTo6m: ImperialDefaults.depthDistance * 2,
            ascentSpeed6m:  ImperialDefaults.depthDistance,
            descentSpeed: ImperialDefaults.descentSpeed,
            lastStopDepth: ImperialDefaults.depthDistance,
            maxEND: ImperialDefaults.maxEnd
        };
    }
}
