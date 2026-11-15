/// <reference lib="webworker" />
import { ConsumptionRequestDto } from 'scuba-physics';
import { PlanningTasks } from './planning.tasks';

addEventListener('message', ({ data }: MessageEvent<ConsumptionRequestDto>) => {
    const response = PlanningTasks.calculateConsumption(data);
    postMessage(response);
});


