import { ProfileTissues } from 'scuba-physics';
import { PlanningTasks } from './planning.tasks';
import { DtoSerialization } from '../shared/dtoSerialization';
import { RestIntervalRequestDto, RestIntervalResultDto } from '../shared/serialization.model';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';

describe('PlanningTasks rest interval tissues', () => {
    const request = (restInterval: number): RestIntervalRequestDto => ({
        tissues: DtoSerialization.fromTissues(ProfileTissues.createAtSurface(0)),
        altitude: 0,
        restInterval: restInterval
    });

    it('returns one sample per second of rest interval', () => {
        const result = PlanningTasks.restIntervalTissues(request(600));

        expect(result.tissueOverPressures.length).toBe(600);
    });

    it('returns no samples for zero rest interval', () => {
        const result = PlanningTasks.restIntervalTissues(request(0));

        expect(result.tissueOverPressures).toEqual([]);
    });

    it('serial factory rest interval worker emits calculated result', () => {
        const task = new WorkersFactoryCommon().createRestIntervalWorker();
        let result: RestIntervalResultDto | undefined;
        task.calculated$.subscribe(r => result = r);

        task.calculate(request(60));

        expect(result?.tissueOverPressures.length).toBe(60);
    });
});
