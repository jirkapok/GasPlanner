import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { SubViewStorage } from './subViewStorage';

@Injectable()
export class DelayedScheduleService {
    private scheduled = false;

    constructor(
        private planner: PlannerService,
        private views: SubViewStorage) {}

    public schedule(): void {
        this.views.saveMainView();

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
