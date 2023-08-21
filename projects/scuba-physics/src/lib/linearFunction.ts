export interface Range {
    start: number;
    end: number;
}

export class LinearFunction {
    public static speed(x: Range, y: Range): number {
        const xChange = x.end - x.start;
        return this.speedByXChange(y, xChange);
    }

    public static speedByXChange(y: Range, xChange: number): number {
        return (y.end - y.start) / xChange;
    }

    public static yValueAt(x: Range, y: Range, xValue: number): number {
        const xChange = xValue - x.start;
        const speed = this.speed(x, y);
        return y.start + speed * xChange;
    }

    public static xValueAt(x: Range, y: Range, yValue: number): number {
        const yChange = yValue - y.start;
        const speed = this.speed(x, y);

        if(speed === 0) {
            return x.start;
        }

        return x.start + yChange / speed;
    }
}

