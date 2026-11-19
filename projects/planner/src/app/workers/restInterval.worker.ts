/// <reference lib="webworker" />
import { RestIntervalRequestDto } from '../shared/serialization.model';
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }: MessageEvent<RestIntervalRequestDto>) => {
    const response = PlanningTasks.restIntervalTissues(data);
    postMessage(response);
});
