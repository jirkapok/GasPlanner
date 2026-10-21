import { Tank, Tanks } from '../consumption/Tanks';
import { Options } from '../algorithm/Options';
import { Time } from '../physics/Time';
import { Precision } from '../common/precision';
import { Segment, Segments } from './Segments';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams, RestingParameters } from '../algorithm/BuhlmannAlgorithmParameters';
import { BailoutBreathing, BreathingModel } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';

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
        segments.add(targetDepth, tank, descentDuration);
        let bottomTime = Time.toSeconds(duration) - descentDuration;
        // not enough time to descent
        bottomTime = bottomTime < 0 ? 0 : bottomTime;
        segments.addFlat(tank, bottomTime);
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

    /**
     * Calculates ascent from the deepest part of the dive, in case of problem.
     * @param breathing Breathing model of the dive, used for the user defined part of the dive.
     * The calculated ascent is always breathed as open circuit from the tanks (bailout).
     */
    public static emergencyAscent(originalPlan: Segment[], options: Options, tanks: Tank[],
        breathing: BreathingModel, surfaceInterval?: RestingParameters): Segment[] {
        const profile = Segments.fromCollection(originalPlan);
        const emergencySegments = profile.deepestPart();
        const issueSegmentIndex = emergencySegments.length;

        // 1. add after the deepest part the solving segment - because it may affect the calculated decompression
        PlanFactory.addSolvingSegment(emergencySegments, options.problemSolvingDuration);

        // 2. add any non deepest segments with tank (i.e. user defined segments)
        // - this covers overhead environment, where we need to follow user defined ascent
        PlanFactory.addUserDefinedAscent(emergencySegments, originalPlan, issueSegmentIndex);

        // 3. calculate real ascent and return all segments after the deepest part
        const emergencyPlan = Segments.fromCollection(emergencySegments);
        const gases = Tanks.toGases(tanks);
        const algorithm = new BuhlmannAlgorithm();
        const bailout = PlanFactory.bailoutBreathing(options, breathing);
        // user defined part (including user defined ascent) is breathed from the loop, only the calculated ascent is bailout
        const parameters = AlgorithmParams.forMultilevelDive(emergencyPlan, gases, options, bailout, surfaceInterval,
            emergencyPlan.length);
        const calculatedProfile = algorithm.decompression(parameters);
        const emergencyProfile = calculatedProfile.segments;
        const ascent = emergencyProfile.slice(issueSegmentIndex, emergencyProfile.length);
        return ascent;
    }

    private static bailoutBreathing(options: Options, breathing: BreathingModel): BreathingModel {
        const depthConverter = new DepthConverterFactory(options).create();
        return new BailoutBreathing(breathing, depthConverter);
    }

    // in case of user defined gas switch without stay at depth (in ascent segment),
    // we prolong the duration at depth, but with current gas.
    private static addSolvingSegment(plan: Segment[], problemSolvingDuration: number): void {
        // no depth defined
        if (plan.length === 0) {
            return;
        }

        const solvingDuration = problemSolvingDuration * Time.oneMinute;
        const last = plan[plan.length - 1];
        const ascentDepth = last.endDepth;
        const gasSource = last.tank ?? last.gas;
        const problemSolving = new Segment(ascentDepth, ascentDepth, gasSource, solvingDuration);
        plan.push(problemSolving);
    }

    // add only segments with tank, i.e. user defined
    private static addUserDefinedAscent(emergencySegments: Segment[], originalPlan: Segment[], issueSegmentIndex: number): void {
        for (let index = issueSegmentIndex; index < originalPlan.length; index++) {
            const userSegment = originalPlan[index];
            if(!userSegment.tank) {
                return;
            }

            emergencySegments.push(userSegment);
        }
    }
}
