import { Options } from '../algorithm/Options';
import { ProfileTissues } from '../algorithm/ProfileTissues';
import { Tank } from '../consumption/Tanks';
import { Diver } from '../consumption/Diver';
import { PlanFactory } from '../depths/PlanFactory';
import { DtoSerialization } from './DtoSerialization';
import { PlanningTasks } from './PlanningTasks';
import {
    ConsumptionRequestDto, DiveInfoRequestDto, ProfileRequestDto, ProfileResultDto
} from './serialization.model';

describe('PlanningTasks', () => {
    const options = new Options();
    const tank = Tank.createDefault();
    tank.id = 1;
    // no decompression dive, which still consumes gas
    const plan = PlanFactory.createPlan(18, 20, tank, options);

    // first dive of the day, as the planner sends it
    const request: ProfileRequestDto = {
        diveId: 1,
        tanks: DtoSerialization.fromTanks([{ id: 1, workingPressureBars: 0, tank: tank }]),
        plan: DtoSerialization.fromSegments(plan.items),
        options: DtoSerialization.fromOptions(options),
        diver: DtoSerialization.fromDiver(new Diver()),
        previousTissues: DtoSerialization.fromTissues(ProfileTissues.createAtSurface(0)),
        surfaceInterval: Number.POSITIVE_INFINITY
    };

    const profileResult: ProfileResultDto = PlanningTasks.calculateDecompression(request);

    const infoRequest: DiveInfoRequestDto = {
        ...request,
        eventOptions: { maxDensity: 5.7 },
        calculatedProfile: profileResult.profile.segments,
        calculatedTissues: profileResult.profile.finalTissues,
        previousCns: 0,
        previousCnsExposures: []
    };

    const consumptionRequest: ConsumptionRequestDto = {
        diveId: 1,
        isComplex: false,
        plan: request.plan,
        profile: profileResult.profile.segments,
        options: request.options,
        consumptionOptions: { diver: request.diver, primaryTankReserve: 30, stageTankReserve: 20 },
        tanks: request.tanks,
        previousTissues: request.previousTissues,
        surfaceInterval: request.surfaceInterval
    };

    it('calculates the profile ending at the surface without errors', () => {
        expect(profileResult.profile.errors).toEqual([]);
        expect(profileResult.profile.segments.at(-1)?.endDepth).toBe(0);
    });

    it('dive info no deco limit is longer than the dive', () => {
        expect(PlanningTasks.diveInfo(infoRequest).noDeco).toBeGreaterThan(20);
    });

    it('consumption consumes gas from the tank', () => {
        expect(PlanningTasks.calculateConsumption(consumptionRequest).tanks[0].consumedVolume).toBeGreaterThan(0);
    });
});
