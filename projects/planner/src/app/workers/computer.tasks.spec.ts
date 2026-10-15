import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { UnitConversion } from '../shared/UnitConversion';
import { PlanRequestFactory } from '../shared/planRequestFactory';
import {
    ComputerFinishedDto, ComputerPointDto, ComputerRequestDto,
    ComputerResultDto, ComputerStartedDto
} from '../shared/serialization.model';
import { ComputerEventType } from '../shared/computer/computer.model';
import { ComputerTasks } from './computer.tasks';
import { PlanningTasks } from './planning.tasks';

describe('ComputerTasks', () => {
    /** Default dive of the planner, deepened to 40 m for 30 min to get deco stops */
    const createRequest = (): ComputerRequestDto => {
        const schedules = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        const dive = schedules.selected;
        dive.depths.plannedDepth = 40;
        dive.depths.planDuration = 30;
        const request = PlanRequestFactory.create(dive, schedules.previousDiveTissues(dive.id));
        return { ...request, calculationId: 7 };
    };

    const calculate = (request: ComputerRequestDto): ComputerResultDto[] => {
        const messages: ComputerResultDto[] = [];
        ComputerTasks.calculate(request, m => messages.push(m));
        return messages;
    };

    const pointsOf = (messages: ComputerResultDto[]): ComputerPointDto[] =>
        messages.filter((m): m is ComputerPointDto => m.type === 'point');

    it('Posts started, point for every second and finished', () => {
        const messages = calculate(createRequest());
        const started = messages[0] as ComputerStartedDto;
        const points = pointsOf(messages);
        expect(started.type).toEqual('started');
        expect(started.total).toBeGreaterThan(0);
        expect(points.length).toEqual(started.total);
        expect(points.map(p => p.index)).toEqual(points.map((_, i) => i));
        expect(points[10].point.runTime).toEqual(10);
        expect((messages[messages.length - 1] as ComputerFinishedDto).type).toEqual('finished');
    });

    it('Every message has the calculation id', () => {
        const messages = calculate(createRequest());
        expect(messages.every(m => m.calculationId === 7)).toBeTrue();
    });

    it('Points are calculated from the planned dive', () => {
        const points = pointsOf(calculate(createRequest()));
        const maxDepth = points[points.length - 1].point.maxDepth;
        expect(maxDepth).toBeCloseTo(40, 6);
    });

    it('Empty plan posts no points', () => {
        const request = { ...createRequest(), plan: [] };
        const messages = calculate(request);
        expect(messages.map(m => m.type)).toEqual(['started', 'finished']);
        expect((messages[0] as ComputerStartedDto).total).toEqual(0);
    });

    it('Points contain calculated no decompression limit', () => {
        const request = createRequest();
        const limits = PlanningTasks.noDecoLimits(request);
        const points = pointsOf(calculate(request));
        expect(points[0].point.ndl).toEqual(limits[0]);
        expect(points[200].point.ndl).toEqual(limits[200]);
        expect(points[200].point.ndl).toBeGreaterThan(0);
    });

    it('Started contains stop events of deco dive', () => {
        const started = calculate(createRequest())[0] as ComputerStartedDto;
        expect(started.events.some(e => e.type === ComputerEventType.stop)).toBeTrue();
    });

    it('Next stop is sent as index of the stop event', () => {
        const messages = calculate(createRequest());
        const started = messages[0] as ComputerStartedDto;
        const withStop = pointsOf(messages).find(p => p.point.nextStopIndex !== undefined);
        const stopIndex = withStop?.point.nextStopIndex ?? -1;
        expect(stopIndex).toBeGreaterThanOrEqual(0);
        expect([ComputerEventType.stop, ComputerEventType.safetyStop]).toContain(started.events[stopIndex]?.type);
        expect('nextStop' in (withStop?.point ?? {})).toBeFalse();
    });
});
