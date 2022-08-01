/// <reference lib="webworker" />
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }) => {
    const response = PlanningTasks.noDecoTime(data);
    postMessage(response);
});


