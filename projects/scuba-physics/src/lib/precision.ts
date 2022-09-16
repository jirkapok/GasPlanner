/** Unified helpers to deal with numbers precision in javascript */
export class Precision {
    // TODO check the nitrox calculator, if we really need this fix, if round isn't enough
    /** because of javascript numbers precision we need to help our self without rounding*/
    public static fix(source: number): number {
        const result = Number(source.toFixed(10));
        return result;
    }

    public static roundTwoDecimals(source: number): number {
        return Precision.round(source, 2);
    }

    public static round(source: number, digits: number = 0): number {
        const precision = Math.pow(10, digits);
        return Math.round(source * precision) / precision;
    }

    public static floorTwoDecimals(source: number): number {
        return Math.floor(source * 100) / 100;
    }

    public static ceilTwoDecimals(source: number): number {
        return Math.ceil(source * 100) / 100;
    }
}
