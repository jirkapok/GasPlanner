import {
    Segments, Gases, BuhlmannAlgorithm, ProfileEvents, DepthConverterFactory,
    Consumption, Time, Diver, OtuCalculator, CnsCalculator, DensityAtDepth
} from 'scuba-physics';
import {
    DtoSerialization,
    ProfileRequestDto, ProfileResultDto, ConsumptionRequestDto,
    ConsumptionResultDto, DiveInfoResultDto
} from '../shared/serialization.model';

export class PlanningTasks {
    /** 1. Calculate profile */
    public static calculateDecompression(data: ProfileRequestDto): ProfileResultDto {
        const tanks = DtoSerialization.toTanks(data.tanks);
        const segments = DtoSerialization.toSegments(data.plan, tanks);
        const plan = Segments.fromCollection(segments);
        const gases = Gases.fromTanks(tanks);
        const algorithm = new BuhlmannAlgorithm();
        const options = DtoSerialization.toOptions(data.options);
        const profile = algorithm.calculateDecompression(options, gases, plan);
        const profileDto = DtoSerialization.fromProfile(profile);
        const events = ProfileEvents.fromProfile(plan.startAscentIndex, profile.segments, profile.ceilings, options);
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
        const tanks = DtoSerialization.toTanks(task.tanks);
        const gases = Gases.fromTanks(tanks);
        const originProfile = DtoSerialization.toSegments(task.plan, tanks);
        const segments = Segments.fromCollection(originProfile);
        const algorithm = new BuhlmannAlgorithm();
        const options = DtoSerialization.toOptions(task.options);
        const noDecoLimit = algorithm.noDecoLimitMultiLevel(segments, gases, options);

        const depthConverter = new DepthConverterFactory(task.options).create();
        const otu = new OtuCalculator(depthConverter).calculateForProfile(originProfile);
        const cns = new CnsCalculator(depthConverter).calculateForProfile(originProfile);
        const density = new DensityAtDepth(depthConverter).forProfile(originProfile);

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
        const diver = new Diver(task.diver.rmv, task.options.maxPpO2);

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
}
