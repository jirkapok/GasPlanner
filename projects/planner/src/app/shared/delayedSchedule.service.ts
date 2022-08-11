import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';

@Injectable({
    providedIn: 'root'
})
export class DelayedScheduleService {
    private scheduled = false;

    constructor(private planner: PlannerService) {}

    public schedule(): void {
        if(this.scheduled) {
            return;
        }

        this.scheduled = true;
        setTimeout(() => {
            this.planner.calculate();
            this.scheduled = false;
        }, 100);
    }
}
