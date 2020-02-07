import { Gas } from "./Gases";

export class Segments {
    public static mergeFlat(segments: Segment[]) {
        const toRemove = [];
        for (var index = segments.length - 1; index > 0; index--) {
            var segment1 = segments[index - 1];
            var segment2 = segments[index];
            if (segment1.levelEquals(segment2)) {
                segment1.addTime(segment2);
                toRemove.push(segment2);
            }
        }

        return segments.filter(s => !toRemove.includes(s));
    };
}

export class Segment {
    constructor (
        public startDepth: number, 
        public endDepth: number, 
        public gas: Gas, 
        public time: number) {}

    public levelEquals(toCompare: Segment): boolean {
        return this.isFlat &&
            toCompare.isFlat &&
            this.startDepth === toCompare.startDepth &&
            this.gas === toCompare.gas
    }

    public get isFlat(): boolean {
        return this.startDepth === this.endDepth;
    }

    public addTime(toAdd: Segment): void {
        this.time += toAdd.time;
    }
}