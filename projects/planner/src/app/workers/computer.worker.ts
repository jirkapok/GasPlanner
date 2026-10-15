/// <reference lib="webworker" />
import { ComputerRequestDto } from '../shared/serialization.model';
import { ComputerTasks } from './computer.tasks';

addEventListener('message', ({ data }: MessageEvent<ComputerRequestDto>) => {
    ComputerTasks.calculate(data, (message) => postMessage(message));
});
