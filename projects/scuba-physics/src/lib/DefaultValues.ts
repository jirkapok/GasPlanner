import { TankConstants } from './StandardTanks';

/** Tank and depths default values, when creating new data in respective units */
export interface DefaultValues {
    primaryTankSize: number;
    primaryTankWorkPressure: number;
    stageTankSize: number;
    stageTankWorkPressure: number;
}

/** Default values of tanks and depths in metric system */
export class MetricDefaults implements DefaultValues {
    public get primaryTankSize(): number {
        return TankConstants.mertricTankSize;
    }

    public get primaryTankWorkPressure(): number {
        return TankConstants.metricTankWorkPressure;
    }

    public get stageTankSize(): number {
        return TankConstants.metricStageSize;
    }

    public get stageTankWorkPressure(): number {
        return TankConstants.metricStageWorkPressure;
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
}
