/// <reference lib="webworker" />
import { ProfileRequestDto } from 'scuba-physics';
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }: MessageEvent<ProfileRequestDto>) => {
    const result = PlanningTasks.calculateDecompression(data);
    postMessage(result);
});
