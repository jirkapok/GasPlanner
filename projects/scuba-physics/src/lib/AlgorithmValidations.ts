import { Ceiling, EventsFactory, Event } from './Profile';
import { Segment } from './Segments';

class BrokenCeilingContext {
    public errors: Event[] = [];
    public lastCeilingIndex = 0; // prevents search in past ceilings
    public currentSegmentStartTime = 0;
    public currentSegmentEndTime = 0;

    public assignSegment(newSegment: Segment): void {
        this.currentSegmentStartTime = this.currentSegmentEndTime;
        this.currentSegmentEndTime += newSegment.duration;
    }

    public ceilingIsBroken(ceiling: Ceiling, segment: Segment): boolean {
        const duration = ceiling.time - this.currentSegmentStartTime;
        const diverDepth = segment.depthAt(duration);
        return ceiling.depth > diverDepth;
    }
}

export class AlgorithmValidations {
    /** Check only user defined segments break ceiling, because we trust the algorithm never breaks ceiling */
    public static validateBrokenCeiling(segments: Segment[], ceilings: Ceiling[]): Event[] {
        const context = new BrokenCeilingContext();

        for (let index = 0; index < segments.length - 1; index++) {
            const segment = segments[index];
            context.assignSegment(segment);
            this.validateCeilings(context, ceilings, segment);
        }

        return context.errors;
    }

    private static validateCeilings(context: BrokenCeilingContext, ceilings: Ceiling[], segment: Segment): void {
        for (context.lastCeilingIndex; context.lastCeilingIndex < ceilings.length - 1; context.lastCeilingIndex++) {
            const ceiling = ceilings[context.lastCeilingIndex];

            if (context.ceilingIsBroken(ceiling, segment)) {
                const event = EventsFactory.createBrokenCeiling(ceiling.time, ceiling.depth);
                context.errors.push(event);
                break;
            }

            if (ceiling.time > context.currentSegmentEndTime) {
                break;
            }
        }
    }
}
