/// <reference lib="webworker" />
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }) => {
    const result = PlanningTasks.calculateDecompression(data);
    postMessage(result);
});
