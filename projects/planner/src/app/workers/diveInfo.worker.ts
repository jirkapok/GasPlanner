/// <reference lib="webworker" />
import { DiveInfoRequestDto, PlanningTasks } from 'scuba-physics';

addEventListener('message', ({ data }: MessageEvent<DiveInfoRequestDto>) => {
    const response = PlanningTasks.diveInfo(data);
    postMessage(response);
});


