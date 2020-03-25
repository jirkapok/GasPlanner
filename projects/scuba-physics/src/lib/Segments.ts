import { Gas } from './Gases';

export class SegmentsValidator {
    public static validate(segments: Segment[], maxPpo: number, isFreshWater: boolean): string[] {
        const messages: string[] = [];

        if (segments.length < 1) {
            messages.push('There needs to be at least one segment at depth.');
        }

        segments.forEach((s, index, items) => {
            this.validateGas(messages, items[index], maxPpo, isFreshWater);
        });

        return messages;
    }

    private static validateGas(messages: string[], segment: Segment, maxPpo: number, isFreshWater: boolean): void {
        const segmentMod = Math.max(segment.startDepth, segment.endDepth);
        const gasMod = segment.gas.mod(maxPpo, isFreshWater);

        if (segmentMod > gasMod) {
            messages.push('Gas is not breathable at bottom segment depth.');
        }

        const segmentCeiling = Math.min(segment.startDepth, segment.endDepth);
        const gasCeiling = segment.gas.ceiling(isFreshWater);

        if (gasCeiling > segmentCeiling) {
            messages.push('Gas is not breathable at segment ceiling.');
        }
    }
}

export class Segments {
    public static mergeFlat(segments: Segment[]): Segment[] {
        const toRemove = [];
        for (let index = segments.length - 1; index > 0; index--) {
            const segment1 = segments[index - 1];
            const segment2 = segments[index];
            if (segment1.levelEquals(segment2)) {
                segment1.addTime(segment2);
                toRemove.push(segment2);
            }
        }

        return segments.filter(s => !toRemove.includes(s));
    }
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
            this.gas === toCompare.gas;
    }

    public get isFlat(): boolean {
        return this.startDepth === this.endDepth;
    }

    public addTime(toAdd: Segment): void {
        this.time += toAdd.time;
    }
}
