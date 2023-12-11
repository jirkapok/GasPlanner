import {
    Segments, Gases, ProfileEvents, DepthConverterFactory,
    Consumption, Time, Diver, OtuCalculator, CnsCalculator, DensityAtDepth, EventOptions,
    AlgorithmParams, BuhlmannAlgorithm, RestingParameters
} from 'scuba-physics';
import {
    ProfileRequestDto, ProfileResultDto, ConsumptionRequestDto,
    ConsumptionResultDto, DiveInfoResultDto
} from '../shared/serialization.model';
import { DtoSerialization } from '../shared/dtoSerialization';

export class PlanningTasks {
    /** 1. Calculate profile */
    public static calculateDecompression(task: ProfileRequestDto): ProfileResultDto {
        const parameters = this.profileParametersFromTask(task);
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.decompression(parameters);
        const profileDto = DtoSerialization.fromProfile(profile);
        const eventOptions: EventOptions = {
            maxDensity: task.eventOptions.maxDensity,
            startAscentIndex: parameters.segments.startAscentIndex,
            profile: profile.segments,
            ceilings: profile.ceilings,
            profileOptions: parameters.options
        };
        const events = ProfileEvents.fromProfile(eventOptions);
        const eventsDto = DtoSerialization.fromEvents(events.items);

        return {
            profile: profileDto,
            events: eventsDto
        };
    }

    /** 2.A calculate dive results */
    public static diveInfo(task: ProfileRequestDto): DiveInfoResultDto {
        // we can't speedup the prediction from already obtained profile,
        // since it may happen, the deco starts during ascent.
        // we cant use the maxDepth, because its purpose is only for single level dives
        const parameters = this.profileParametersFromTask(task);
        const algorithm = new BuhlmannAlgorithm();
        const noDecoLimit = algorithm.noDecoLimit(parameters);
        const depthConverter = new DepthConverterFactory(task.options).create();
        const originalProfile = parameters.segments.items;
        const otu = new OtuCalculator(depthConverter).calculateForProfile(originalProfile);
        const cns = new CnsCalculator(depthConverter).calculateForProfile(originalProfile);
        const density = new DensityAtDepth(depthConverter).forProfile(originalProfile);

        return {
            noDeco: noDecoLimit,
            otu: otu,
            cns: cns,
            density: DtoSerialization.fromDensity(density)
        };
    }

    /** 2.B calculate consumption only as the most time consuming operation */
    public static calculateConsumption(task: ConsumptionRequestDto): ConsumptionResultDto {
        const depthConverter = new DepthConverterFactory(task.options).create();
        const consumption = new Consumption(depthConverter);

        // deserialize
        const tanks = DtoSerialization.toTanks(task.tanks);
        const originProfile = DtoSerialization.toSegments(task.profile, tanks);
        const segments = DtoSerialization.toSegments(task.plan, tanks);
        const plan = Segments.fromCollection(segments);
        // diver ppO2 is irrelevant for consumption calculation
        const diver = new Diver(task.diver.rmv);

        const options = DtoSerialization.toOptions(task.options);
        // Max bottom changes tank consumed bars, so we need it calculate before real profile consumption
        const maxTime = consumption.calculateMaxBottomTime(plan, tanks, diver, options);
        const emergencyAscent = consumption.emergencyAscent(originProfile, options, tanks);
        let timeToSurface = Segments.duration(emergencyAscent);
        timeToSurface = Time.toMinutes(timeToSurface);
        consumption.consumeFromTanks2(originProfile, emergencyAscent, options, tanks, diver);

        return {
            maxTime,
            timeToSurface,
            tanks: DtoSerialization.toConsumed(tanks),
        };
    }

    private static profileParametersFromTask(task: ProfileRequestDto): AlgorithmParams {
        const tanks = DtoSerialization.toTanks(task.tanks);
        const gases = Gases.fromTanks(tanks);
        const originProfile = DtoSerialization.toSegments(task.plan, tanks);
        const segments = Segments.fromCollection(originProfile);
        const options = DtoSerialization.toOptions(task.options);
        const tissues = DtoSerialization.toTissues(task.tissues);
        const rest = new RestingParameters(tissues, task.surfaceInterval);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, rest);
    }
}
