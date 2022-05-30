import { DepthConverter } from './depth-converter';
import { SafetyStop } from './Options';


export interface DepthLevelOptions {
    /** depth of the last stop in meters, needs to be positive number */
    lastStopDepth: number;
    safetyStop: SafetyStop;

    /**
     * Depth difference between two deco stops in metres.
     * Default 3 meters
     */
    decoStopDistance: number;

    /** Depth in meters, default 10 meters */
    minimumAutoStopDepth: number;
}

export class DepthLevels {
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

        const rounded = Math.floor(currentDepth / this.options.decoStopDistance) * this.options.decoStopDistance;

        if (rounded !== currentDepth) {
            return rounded;
        }

        const result = currentDepth - this.options.decoStopDistance;

        if(result <= this.options.lastStopDepth) {
            return this.options.lastStopDepth;
        }

        return result;
    }

    public addSafetyStop(currentDepth: number, maxDepth: number): boolean {
        return (this.options.safetyStop === SafetyStop.always ||
                (this.options.safetyStop === SafetyStop.auto && maxDepth > this.options.minimumAutoStopDepth)) &&
                 currentDepth === this.options.lastStopDepth;
    }

    // depth in meters, returns also meters
    private roundToDeco(depth: number): number {
        return Math.round(depth / this.options.decoStopDistance) * this.options.decoStopDistance;
    }
}
