export interface Range {
    start: number;
    end: number;
}

export class LinearFunction {
    public static speed(x: Range, y: Range): number {
        const xChange = x.end - x.start;
        return LinearFunction.speedByXChange(y.start, y.end, xChange);
    }

    public static speedByXChange(yStart: number, yEnd: number, xChange: number): number {
        return (yEnd - yStart) / xChange;
    }

    public static yValueAt(yStart: number, speed: number, xChange: number): number {
        return yStart + speed * xChange;
    }

    /** Returns absolute x value */
    public static xValueAtAbsolute(x: Range, y: Range, yValue: number): number {
        const speed = this.speed(x, y);
        return x.start + LinearFunction.xValueAt(y.start, speed, yValue);
    }

    /** Returns relative X value, because the xStart is unknown */
    public static xValueAt(yStart: number, speed: number, yValue: number): number {
        if(speed === 0) {
            return 0;
        }

        return (yValue - yStart) / speed;
    }
}

