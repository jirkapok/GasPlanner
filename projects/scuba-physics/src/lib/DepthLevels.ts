// TODO add last stop option as field
// add tests
// Move safety stop decision here
export class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;

    // current depth in meters
    public static firstStop(currentDepth: number): number {
        if (currentDepth <= DepthLevels.decoStopDistance) {
            return 0;
        }

        const rounded = Math.floor(currentDepth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (rounded === currentDepth) {
            return currentDepth - DepthLevels.decoStopDistance;
        }

        return rounded;
    }

    /** return negative number for ascent to surface */
    public static nextStop(lastStop: number): number {
        return lastStop - DepthLevels.decoStopDistance;
    }

    // depth in meters, returns also meters
    public static roundToDeco(depth: number): number {
        return Math.round(depth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
    }
}
