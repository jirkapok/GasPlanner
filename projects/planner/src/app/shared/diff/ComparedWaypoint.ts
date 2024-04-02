import { WayPoint } from "../models";

export class ComparedWaypoint {
    public selected = false;
    /** in Seconds */
    public runTime: number;
    /** In respective units */
    public depthA: number | undefined;
    /** in Seconds */
    public durationA: number | undefined;
    /** In respective units */
    public depthB: number | undefined;
    /** in Seconds */
    public durationB: number | undefined;

    public constructor(
        runtime: number,
        public wayPointA: WayPoint | undefined,
        public wayPointB: WayPoint | undefined) {
        this.runTime = runtime;
        this.depthA = this.wayPointA?.endDepth;
        this.durationA = this.wayPointA?.duration;
        this.depthB = this.wayPointB?.endDepth;
        this.durationB = this.wayPointB?.duration;
    }

    private get endTime(): number {
        const duration = this.durationA ?? this.durationB!;
        return this.runTime + duration;
    }

    public fits(timeStamp: number): boolean {
        return this.runTime <= timeStamp && timeStamp < this.endTime;
    }
}
