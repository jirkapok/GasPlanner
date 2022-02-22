import { SafetyStop } from './Options';

export class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;
    private static readonly minimumAutoStopDepth = 10;

    // constructor(private lastStopDepth: number) {}
    constructor(private lastStopDepth: number, private safetyStop: SafetyStop) { }

    // depth in meters, returns also meters
    public static roundToDeco(depth: number): number {
        return Math.round(depth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
    }

    // current and return depth in meters
    public firstStop(currentDepth: number): number {
        if (currentDepth <= this.lastStopDepth) {
            return 0;
        }

        const rounded = Math.floor(currentDepth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (rounded === currentDepth) {
            return this.nextStop(currentDepth);
        }

        return rounded;
    }

    /**
     * returns 0 m for ascent to surface
     * currentDepth and return value in meters
     * this creates ascent using 3 meter increments
    */
    public nextStop(currentDepth: number): number {
        if(currentDepth <= this.lastStopDepth) {
            return 0;
        }

        return currentDepth - DepthLevels.decoStopDistance;
    }

    public addSafetyStop(currentDepth: number, maxDepth: number): boolean {
        return (this.safetyStop === SafetyStop.always ||
                (this.safetyStop === SafetyStop.auto && maxDepth > DepthLevels.minimumAutoStopDepth)) &&
                 currentDepth === this.lastStopDepth;
    }
}
