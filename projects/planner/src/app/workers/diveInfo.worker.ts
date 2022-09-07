/// <reference lib="webworker" />
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }) => {
    const response = PlanningTasks.diveInfo(data);
    postMessage(response);
});


