import { DepthLevels } from './DepthLevels';
import { Density, Gravity, AltitudePressure, PressureConverter } from './pressure-converter';

export interface DepthOptions {
    /** Meters above see level, 0 for see level */
    altitude: number;
    isFreshWater: boolean;
}

export class DepthConverterFactory {
    constructor(private options: DepthOptions) { }

    /** Creates new instance of depth converter based on provided options */
    create(): DepthConverter {
        if (this.options.isFreshWater) {
            return DepthConverter.forFreshWater(this.options.altitude);
        }

        return DepthConverter.forSaltWater(this.options.altitude);
    }
}

export class DepthConverter {
    private _surfacePressure: number;

    private constructor(private density: number, altitude: number) {
        const pressureInPascals = AltitudePressure.atAltitude(altitude);
        this._surfacePressure = PressureConverter.pascalToBar(pressureInPascals);
    }

    /**
     * Creates new instance of depth converter
     * @param altitude Meters above see level, 0 for see level
     */
    public static forSaltWater(altitude: number = 0): DepthConverter {
        return new DepthConverter(Density.salt, altitude);
    }

    /**
     * Creates new instance of depth converter
     * @param altitude Meters above see level, 0 for see level
     */
    public static forFreshWater(altitude: number = 0): DepthConverter {
        return new DepthConverter(Density.fresh, altitude);
    }

    public get surfacePressure(): number {
        return this._surfacePressure;
    }

    /**
     * Calculates the absolute pressure (in bars) for 1 cubic meter of water for the given depth (meters).
     *
     * @param depth - The depth in meters below the surface for 1 cubic meter volume of water.
     * @returns The absolute pressure (in bars) for the given depth (in meters) of 1 cubic meter volume of water below the surface.
     */
    public toBar(depth: number): number {
        const weightDensity = this.density * Gravity.standard;
        return PressureConverter.pascalToBar((depth * weightDensity)) + this._surfacePressure;
    }

    /**
     * Calculates the depth (in meters) for the given atmosphere (bar).
     *
     * @param bars - The number of atmospheric pressure (in bars) to convert.
     * @returns The depth (in meters) for the given number of atmospheres.
     */
    public fromBar(bars: number): number {
        if (bars < this._surfacePressure) {
            throw new Error('Lower pressure than altitude isn`t convertible to depth.');
        }

        const weightDensity = this.density * Gravity.standard;
        const pressure = PressureConverter.barToPascal(bars - this._surfacePressure);
        return pressure / weightDensity;
    }

    /**
     * Converts the pressure to depth in meters and round it to nearest deco stop
     *
     * @param depthPressure depth in bars
     */
    public toDecoStop(depthPressure: number): number {
        const depth = this.fromBar(depthPressure);
        return DepthLevels.roundToDeco(depth);
    }
}
