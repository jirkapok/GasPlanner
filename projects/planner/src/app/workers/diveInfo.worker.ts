/// <reference lib="webworker" />
import { DiveInfoRequestDto } from 'scuba-physics';
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }: MessageEvent<DiveInfoRequestDto>) => {
    const response = PlanningTasks.diveInfo(data);
    postMessage(response);
});


