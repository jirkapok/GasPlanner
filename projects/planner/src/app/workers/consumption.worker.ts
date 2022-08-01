/// <reference lib="webworker" />

import { Consumption, DepthConverterFactory, Segments, Time } from 'scuba-physics';
import { DtoSerialization, ConsumptionResultDto, ConsumptionRequestDto, } from '../shared/serialization.model';

addEventListener('message', ({ data }) => {
    const response = ConsumptionTask.calculateConsumption(data);
    postMessage(response);
});

class ConsumptionTask {
    public static calculateConsumption(task: ConsumptionRequestDto): ConsumptionResultDto {
        const depthConverter = new DepthConverterFactory(task.options).create();
        const consumption = new Consumption(depthConverter);

        // deserialize
        const tanks = DtoSerialization.toTanks(task.tanks);
        const originProfile = DtoSerialization.toSegments(task.profile, tanks);
        const segments = DtoSerialization.toSegments(task.plan, tanks);
        const plan = Segments.fromCollection(segments);

        // Max bottom changes tank consumed bars, so we need it calculate before real profile consumption
        const maxTime = consumption.calculateMaxBottomTime(plan, tanks, task.diver, task.options);
        const emergencyAscent = consumption.emergencyAscent(originProfile, task.options, tanks);
        let timeToSurface = Segments.duration(emergencyAscent);
        timeToSurface = Time.toMinutes(timeToSurface);
        consumption.consumeFromTanks2(originProfile, emergencyAscent, task.options, tanks, task.diver);
        return {
            maxTime,
            timeToSurface,
            tanks: DtoSerialization.fromTanks(tanks),
        };
    }
}

