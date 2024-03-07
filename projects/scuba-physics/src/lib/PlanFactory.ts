import { Tank } from './Tanks';
import { Options } from './Options';
import { Time } from './Time';
import { Precision } from './precision';
import { Segment, Segments } from './Segments';
import { Gases } from './Gases';
import { AlgorithmParams, BuhlmannAlgorithm } from './BuhlmannAlgorithm';

/** Creates skeleton for dive profile */
export class PlanFactory {

    /**
     * Generates descent and swim segments for one level profile and returns newly created segments.
     * Returns always two segments.
     * If there isn't enough time for swim at target depth, the second segment duration is zero seconds.
     *
     * @param targetDepth in meters
     * @param duration in minutes
     * @param tank to be assigned to the segments
     * @param options Ascent/descent speeds
     */
    public static createPlan(targetDepth: number, duration: number, tank: Tank, options: Options): Segments {
        const segments = new Segments();
        const descentDuration = PlanFactory.descentDuration(targetDepth, options);
        const descent = segments.add(0, targetDepth, tank.gas, descentDuration);
        descent.tank = tank;
        let bottomTime = Time.toSeconds(duration) - descentDuration;
        // not enough time to descent
        bottomTime = bottomTime < 0 ? 0 : bottomTime;
        const swim = segments.addFlat(targetDepth, tank.gas, bottomTime);
        swim.tank = tank;
        return segments;
    }

    /** Calculates duration in seconds for descent from surface to target depth (meters) based on descent speed */
    public static descentDuration(targetDepth: number, options: Options): number {
        // to avoid precise numbers lik 1.6666 minutes when using speed 18 meters/min
        let estimate = targetDepth / options.descentSpeed;
        // loosing precision +-6 seconds acceptable rounding
        estimate = Precision.ceil(estimate, 1);
        estimate = Time.toSeconds(estimate);
        return Precision.ceil(estimate);
    }

    public static emergencyAscent(segments: Segment[], options: Options, tanks: Tank[]): Segment[] {
        const profile = Segments.fromCollection(segments);
        const deepestPart = profile.deepestPart();
        const deepestProfile = Segments.fromCollection(deepestPart);
        const gases = Gases.fromTanks(tanks);
        const algorithm = new BuhlmannAlgorithm();
        const parameters = AlgorithmParams.forMultilevelDive(deepestProfile, gases, options);
        const emergencyProfile = algorithm.decompression(parameters);
        const emergencySegments = emergencyProfile.segments;
        const ascent = emergencySegments.slice(deepestPart.length, emergencySegments.length);
        PlanFactory.addSolvingSegment(ascent, options.problemSolvingDuration);
        return ascent;
    }


    // in case of user defined gas switch without stay at depth (in ascent segment), we prolong the duration at depth
    private static addSolvingSegment(ascent: Segment[], problemSolvingDuration: number): void {
        // all segments are user defined
        if (ascent.length === 0) {
            return;
        }

        const solvingDuration = problemSolvingDuration * Time.oneMinute;
        const ascentDepth = ascent[0].startDepth;
        const problemSolving = new Segment(ascentDepth, ascentDepth, ascent[0].gas, solvingDuration);
        ascent.unshift(problemSolving);
    }
}
