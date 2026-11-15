/// <reference lib="webworker" />
import { ConsumptionRequestDto, PlanningTasks } from 'scuba-physics';

addEventListener('message', ({ data }: MessageEvent<ConsumptionRequestDto>) => {
    const response = PlanningTasks.calculateConsumption(data);
    postMessage(response);
});


