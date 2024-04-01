export class ComparedWaypoint {
    public selected = false;
    public constructor(
        /** in Seconds */
        public runTime: number,
        /** In respective units */
        public depthA: number | undefined,
        /** in Seconds */
        public durationA: number | undefined,
        /** In respective units */
        public depthB: number | undefined,
        /** in Seconds */
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
