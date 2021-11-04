import { TestBed, inject } from '@angular/core/testing';

import { PreferencesService } from './preferences.service';
import { PlannerService } from './planner.service';

describe('PreferencesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PreferencesService, PlannerService]
        });
    });

    it('loads saved default values', inject([PreferencesService, PlannerService],
        (service: PreferencesService, planner: PlannerService) => {
            const expectedSac = 10;
            planner.calculate();
            const diver = planner.diver;
            diver.sac = expectedSac;
            service.saveDefaults();
            diver.sac = 20;
            service.loadDefaults();
            // TODO add more validation of restored data
            expect(diver.sac).toBe(expectedSac);
        }));

    it('loads saved disclaimer', inject([PreferencesService, PlannerService],
        (service: PreferencesService, planner: PlannerService) => {
            service.disableDisclaimer();
            const enabled = service.disclaimerEnabled();
            expect(enabled).toBeFalsy();
        }));
});
