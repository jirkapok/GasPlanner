import { DepthConverter } from './depth-converter';
import { SafetyStop } from './Options';

export class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;
    private static readonly minimumAutoStopDepth = 10;

    // constructor(private lastStopDepth: number) {}
    constructor(private depthConverter: DepthConverter, private lastStopDepth: number, private safetyStop: SafetyStop) { }

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
        if (currentDepth <= this.lastStopDepth) {
            return 0;
        }

        const rounded = Math.floor(currentDepth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (rounded !== currentDepth) {
            return rounded;
        }

        const result = currentDepth - DepthLevels.decoStopDistance;

        if(result <= this.lastStopDepth) {
            return this.lastStopDepth;
        }

        return result;
    }

    public addSafetyStop(currentDepth: number, maxDepth: number): boolean {
        return (this.safetyStop === SafetyStop.always ||
                (this.safetyStop === SafetyStop.auto && maxDepth > DepthLevels.minimumAutoStopDepth)) &&
                 currentDepth === this.lastStopDepth;
    }

    // depth in meters, returns also meters
    private roundToDeco(depth: number): number {
        return Math.round(depth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
    }
}
