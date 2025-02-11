/** Unified helpers to deal with numbers precision in javascript */
export class Precision {
    /**
     * In the nitrox calculator, if we really need this fix, if round isn't enough
     * because of javascript numbers precision we need to help our self without rounding
     **/
    public static fix(source: number): number {
        const result = Number(source.toFixed(10));
        return result;
    }

    public static roundTwoDecimals(source: number): number {
        return Precision.round(source, 2);
    }

    public static round(source: number, digits: number = 0): number {
        return Precision.adapt(Math.round, source, digits);
    }

    public static floorTwoDecimals(source: number): number {
        return Precision.floor(source, 2);
    }

    public static floor(source: number, digits: number = 0): number {
        return Precision.adapt(Math.floor, source, digits);
    }

    public static ceilTwoDecimals(source: number): number {
        return Precision.ceil(source, 2);
    }

    public static ceil(source: number, digits: number = 0): number {
        return Precision.adapt(Math.ceil, source, digits);
    }

    public static ceilDistance(source: number, distance: number): number {
        return Precision.adaptDistance(Math.ceil, source, distance);
    }

    public static roundDistance(source: number, distance: number): number {
        return Precision.adaptDistance(Math.round, source, distance);
    }

    public static floorDistance(source: number, distance: number): number {
        return Precision.adaptDistance(Math.floor, source, distance);
    }

    private static adapt(func: (source: number) => number, source: number, digits: number): number {
        const precision = Math.pow(10, digits);
        return func(source * precision) / precision;
    }

    private static adaptDistance(func: (source: number) => number, source: number, distance: number): number {
        return func(source / distance) * distance;
    }
}
