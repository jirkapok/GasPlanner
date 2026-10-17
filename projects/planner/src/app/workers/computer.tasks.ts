import { Ceiling, ComputerEvent, DiveComputer, RunTimePoint } from 'scuba-physics';
import { DtoSerialization } from '../shared/dtoSerialization';
import { ComputerPointDto, ComputerRequestDto, ComputerResultDto } from '../shared/serialization.model';
import { PlanningTasks } from './planning.tasks';

/** Streams the dive computer data calculated by the library from the already calculated dive */
export class ComputerTasks {
    /** Posts started, one point for every second of the dive and finished message */
    public static calculate(task: ComputerRequestDto, post: (message: ComputerResultDto) => void): void {
        const calculationId = task.calculationId;
        const tanks = DtoSerialization.toTanks(task.tanks);
        const computer = DiveComputer.start({
            dive: PlanningTasks.diveParameters(task),
            profile: DtoSerialization.toSegments(task.profile, tanks),
            ceilings: task.ceilings.map(c => new Ceiling(c.time, c.depth)),
            events: DtoSerialization.toEvents(task.events).items
        });

        post({ calculationId: calculationId, type: 'started', total: computer.total, events: computer.events });
        let index = 0;

        // NDL is the slow part, so every point is posted as soon as its limit is calculated
        for (const point of computer.points()) {
            post(ComputerTasks.toPointMessage(calculationId, computer.events, index, point));
            index++;
        }

        post({ calculationId: calculationId, type: 'finished' });
    }

    private static toPointMessage(calculationId: number, events: ComputerEvent[], index: number, point: RunTimePoint): ComputerPointDto {
        const { nextStop, ...values } = point;
        const nextStopIndex = nextStop ? events.indexOf(nextStop) : undefined;

        return {
            calculationId: calculationId,
            type: 'point',
            index: index,
            point: { ...values, nextStopIndex: nextStopIndex }
        };
    }
}
