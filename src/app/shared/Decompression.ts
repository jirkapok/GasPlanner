export class Limit {
    public get depth(): number {
        return this._depth;
    }
    public get time(): number{
        return this._time;
    }

    constructor(private _depth: number, private _time: number) {
    }
}

/**
 * No decompression times based on IANTD air tables at sea level
 */
export class Decompression {
    private static readonly maxDepth = 42;

    private static readonly limits: Limit[] = [
        new Limit(12, 125),
        new Limit(15, 75),
        new Limit(18, 51),
        new Limit(21, 35),
        new Limit(24, 25),
        new Limit(27, 20),
        new Limit(30, 17),
        new Limit(33, 14),
        new Limit(36, 12),
        new Limit(39, 10),
        new Limit(Decompression.maxDepth, 9)
    ];

    public static noDecoTime(depth: number): number {
        if (depth > Decompression.maxDepth) {
            return 0;
        }

        for (const limit of this.limits) {
            if (limit.depth >= depth) {
                return limit.time;
            }
        }

        return Number.POSITIVE_INFINITY;
    }
}

