import { DepthConverter } from './depth-converter';
import { SafetyStop } from './Options';


export interface DepthLevelOptions {
    /** depth of the last stop in meters, needs to be positive number */
    lastStopDepth: number;
    safetyStop: SafetyStop;
}

export class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;
    private static readonly minimumAutoStopDepth = 10;

    // constructor(private lastStopDepth: number) {}
    constructor(private depthConverter: DepthConverter, private options: DepthLevelOptions) { }

    /**
     * Converts the pressure to depth in meters and round it to nearest deco stop
     *
     * @param depthPressure depth in bars
     */
    public toDecoStop(depthPressure: number): number {
        const depth = this.depthConverter.fromBar(depthPressure);
        return this.roundToDeco(depth);
    }

    /**
     * returns 0 m for ascent to surface
     * currentDepth and return value in meters
     * this creates ascent using 3 meter increments
    */
    public nextStop(currentDepth: number): number {
        if (currentDepth <= this.options.lastStopDepth) {
            return 0;
        }

        const rounded = Math.floor(currentDepth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (rounded !== currentDepth) {
            return rounded;
        }

        const result = currentDepth - DepthLevels.decoStopDistance;

        if(result <= this.options.lastStopDepth) {
            return this.options.lastStopDepth;
        }

        return result;
    }

    public addSafetyStop(currentDepth: number, maxDepth: number): boolean {
        return (this.options.safetyStop === SafetyStop.always ||
                (this.options.safetyStop === SafetyStop.auto && maxDepth > DepthLevels.minimumAutoStopDepth)) &&
                 currentDepth === this.options.lastStopDepth;
    }

    // depth in meters, returns also meters
    private roundToDeco(depth: number): number {
        return Math.round(depth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
    }
}
