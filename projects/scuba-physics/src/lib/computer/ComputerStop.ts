import { Event, EventType } from '../algorithm/CalculatedProfile';
import { Time } from '../physics/Time';
import { ComputerEvent, ComputerEventType, GasSwitchEvent, StopEvent } from './ComputerData';

/** Decompression or safety stop shown by the dive computer */
export class ComputerStop implements StopEvent {
    constructor(
        public readonly type: ComputerEventType.stop | ComputerEventType.safetyStop,
        /** in seconds since start of the dive */
        public readonly runTime: number,
        /** in meters */
        public readonly depth: number,
        /** in seconds */
        public readonly duration: number
    ) {
    }

    /** Run time in seconds since start of the dive, when the stop ends */
    public get stopEnd(): number {
        return this.runTime + this.duration;
    }

    /** Converts events calculated by the algorithm to events shown by the dive computer, other events are ignored */
    public static eventsFrom(source: Event[]): ComputerEvent[] {
        const events: ComputerEvent[] = [];

        source.forEach((event) => {
            const converted = ComputerStop.toComputerEvent(event);

            if (converted) {
                events.push(converted);
            }
        });

        return events;
    }

    private static toComputerEvent(event: Event): ComputerEvent | undefined {
        const runTime = event.timeStamp;
        const depth = event.depth;

        switch (event.type) {
            case EventType.highPpO2:
                return { type: ComputerEventType.highPpO2, runTime: runTime, depth: depth };
            case EventType.lowPpO2:
                return { type: ComputerEventType.lowPpO2, runTime: runTime, depth: depth };
            case EventType.brokenCeiling:
                return { type: ComputerEventType.brokenCeiling, runTime: runTime, depth: depth };
            case EventType.gasSwitch: {
                const gasSwitch: GasSwitchEvent = {
                    type: ComputerEventType.gasSwitch,
                    runTime: runTime,
                    depth: depth,
                    gasName: event.gas?.name ?? ''
                };
                return gasSwitch;
            }
            case EventType.safetyStop:
                return new ComputerStop(ComputerEventType.safetyStop, runTime, depth, Time.safetyStopDuration);
            default:
                return undefined;
        }
    }

    /** New stop starting at the same moment as this stop, but ending at the given run time in seconds since start of the dive */
    public endAt(runTime: number): ComputerStop {
        return new ComputerStop(this.type, this.runTime, this.depth, runTime - this.runTime);
    }

    /** True, if both stops happen at least partially at the same time */
    public overlaps(other: ComputerStop): boolean {
        return this.runTime < other.stopEnd && other.runTime < this.stopEnd;
    }
}
