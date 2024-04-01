export class ComparedWaypoint {
    public selected = false;
    public constructor(
        public runTime: number,
        public depthA: number | undefined,
        public durationA: number | undefined,
        public depthB: number | undefined,
        public durationB: number | undefined) {
    }

    private get endTime(): number {
        const duration = this.durationA ?? this.durationB!;
        return this.runTime + duration;
    }

    public fits(timeStamp: number): boolean {
        return this.runTime <= timeStamp && timeStamp < this.endTime;
    }
}
