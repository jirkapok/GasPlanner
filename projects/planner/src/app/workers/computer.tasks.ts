import { DtoSerialization } from '../shared/dtoSerialization';
import { BoundEvent } from '../shared/models';
import {
    CalculatedProfileDto, ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, EventOptionsDto
} from '../shared/serialization.model';
import { UnitConversion } from '../shared/UnitConversion';
import { WayPointsService } from '../shared/waypoints.service';
import { ComputerData } from '../shared/computer/computer.model';
import { ComputerProfile, ComputerSource } from '../shared/computer/computerProfile';
import { PlanningTasks } from './planning.tasks';

/** The whole calculation of the dive computer data, running in the worker */
export class ComputerTasks {
    /** Density events aren't shown by the computer, but the dive info calculation requires the limit */
    private static readonly eventOptions: EventOptionsDto = { maxDensity: 5.7 };

    /** Posts started, one point for every second of the dive and finished message */
    public static calculate(task: ComputerRequestDto, post: (message: ComputerResultDto) => void): void {
        const calculationId = task.calculationId;
        const profile = PlanningTasks.calculateDecompression(task).profile;

        if (profile.errors.length > 0) {
            post({ calculationId: calculationId, type: 'started', total: 0, events: [] });
            post({ calculationId: calculationId, type: 'finished' });
            return;
        }

        const data = ComputerTasks.calculateData(task, profile);
        post({ calculationId: calculationId, type: 'started', total: data.profile.length, events: data.events });

        let index = 0;
        let lastLimit = 0;

        // NDL is the slow part, so every point is posted as soon as its limit is calculated
        for (const limit of PlanningTasks.noDecoLimitsSequence(task)) {
            if (index >= data.profile.length) {
                break;
            }

            lastLimit = limit;
            post(ComputerTasks.toPointMessage(calculationId, data, index, limit));
            index++;
        }

        // limits may be shorter in case of fractional segment durations
        for (; index < data.profile.length; index++) {
            post(ComputerTasks.toPointMessage(calculationId, data, index, lastLimit));
        }

        post({ calculationId: calculationId, type: 'finished' });
    }

    private static toPointMessage(calculationId: number, data: ComputerData, index: number, ndl: number): ComputerPointDto {
        return {
            calculationId: calculationId,
            type: 'point',
            index: index,
            point: { ...data.profile[index], ndl: ndl }
        };
    }

    private static calculateData(task: ComputerRequestDto, profile: CalculatedProfileDto): ComputerData {
        const tanks = DtoSerialization.toTanks(task.tanks);
        const calculatedProfile = DtoSerialization.toProfile(profile, tanks);
        const diveInfo = PlanningTasks.diveInfo({
            ...task,
            calculatedProfile: profile.segments,
            calculatedTissues: profile.finalTissues,
            eventOptions: ComputerTasks.eventOptions,
            previousCns: 0,
            previousCnsExposures: []
        });
        // values in meters are used, so the units don't matter
        const units = new UnitConversion();
        const source: ComputerSource = {
            wayPoints: new WayPointsService(units).calculateWayPoints(calculatedProfile.segments),
            ceilings: diveInfo.ceilings,
            events: DtoSerialization.toEvents(diveInfo.events).items.map(e => new BoundEvent(units, e))
        };

        return ComputerProfile.calculate(source, {
            userSegments: task.plan.length
        });
    }
}
