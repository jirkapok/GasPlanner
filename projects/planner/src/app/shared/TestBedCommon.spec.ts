import { TestBed } from '@angular/core/testing';
import { DepthsService } from './depths.service';

export class TestBedExtensions {
    /** Enforces to create the DepthsService instance, which sets the plan */
    public static initPlan() {
        // TODO remove TestBedExtensions.initPlan
        const depths = TestBed.inject(DepthsService);
        depths.plannedDepth = 30;
        depths.planDuration = 12;
        depths.setSimple();
    }
}
