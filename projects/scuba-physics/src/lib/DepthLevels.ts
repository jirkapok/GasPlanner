// TODO add last stop option as field
// add tests
// Move safety stop decision here
export class DepthLevels {
    /**
     * Depth difference between two deco stops in metres.
     */
    public static readonly decoStopDistance = 3;

    public static lastStopDepth = 3;

    // current depth in meters
    public static firstStop(currentDepth: number): number {
        if (currentDepth <= DepthLevels.lastStopDepth) {
            return 0;
        }

        const rounded = Math.floor(currentDepth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;

        if (rounded === currentDepth) {
            return DepthLevels.nextStop(currentDepth);
        }

        return rounded;
    }

    /** return negative number for ascent to surface */
    public static nextStop(currentDepth: number): number {
        if(currentDepth < DepthLevels.lastStopDepth) {
            return currentDepth - DepthLevels.lastStopDepth;
        }

        return currentDepth - DepthLevels.decoStopDistance;
    }

    // depth in meters, returns also meters
    public static roundToDeco(depth: number): number {
        return Math.round(depth / DepthLevels.decoStopDistance) * DepthLevels.decoStopDistance;
    }
}
