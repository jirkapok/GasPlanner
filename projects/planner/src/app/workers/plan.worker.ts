/// <reference lib="webworker" />

import { Consumption, DepthConverterFactory, Segments, Time } from 'scuba-physics';
import { PlanRequestDto, DiveResultDto } from '../shared/serializationmodel';
import { DtoSerialization } from '../shared/serializationmodel';

addEventListener('message', ({ data }) => {
    const response = calculateConsumption(data);
    postMessage(response);
});

const calculateConsumption = (task: PlanRequestDto): DiveResultDto => {
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
        tanks: DtoSerialization.toTankPreferences(tanks),
    };
};
