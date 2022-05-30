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
    private decoStopDistance = 3;

    /** Depth in meters */
    private minimumAutoStopDepth = 10;

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

        const rounded = Math.floor(currentDepth / this.decoStopDistance) * this.decoStopDistance;

        if (rounded !== currentDepth) {
            return rounded;
        }

        const result = currentDepth - this.decoStopDistance;

        if(result <= this.options.lastStopDepth) {
            return this.options.lastStopDepth;
        }

        return result;
    }

    public addSafetyStop(currentDepth: number, maxDepth: number): boolean {
        return (this.options.safetyStop === SafetyStop.always ||
                (this.options.safetyStop === SafetyStop.auto && maxDepth > this.minimumAutoStopDepth)) &&
                 currentDepth === this.options.lastStopDepth;
    }

    // depth in meters, returns also meters
    private roundToDeco(depth: number): number {
        return Math.round(depth / this.decoStopDistance) * this.decoStopDistance;
    }
}
