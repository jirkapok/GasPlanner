import { Gas } from "./Gases";

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
}