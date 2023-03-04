import { TestBed } from '@angular/core/testing';
import { Segment } from 'scuba-physics';

import { Plan } from './plan.service';

describe('Plan service', () => {
    let plan: Plan;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ Plan ]
        });
        plan = TestBed.inject(Plan);
    });

    it('Does not load empty plan', () => {
        let reloaded = false;
        plan.reloaded$.subscribe(() => reloaded = true);
        const segments: Segment[] = [];
        plan.loadFrom(segments);
        expect(reloaded).toBeFalsy();
    });
});
