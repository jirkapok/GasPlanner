import { TankConstants } from './StandardTanks';

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
}

/** Default values of tanks and depths in Imperial system */
export class ImperialDefaults implements DefaultValues {
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
        return 10;
    }
}
