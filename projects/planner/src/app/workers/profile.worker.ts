/// <reference lib="webworker" />
import { ProfileRequestDto, PlanningTasks } from 'scuba-physics';

addEventListener('message', ({ data }: MessageEvent<ProfileRequestDto>) => {
    const result = PlanningTasks.calculateDecompression(data);
    postMessage(result);
});
