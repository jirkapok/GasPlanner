import { TestBed } from '@angular/core/testing';
import { WaypointsDifferenceService } from './waypoints-difference.service';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from './dive.schedules';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';

describe('WayPoints Difference Service', () => {
    let sut: WaypointsDifferenceService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                WaypointsDifferenceService, ProfileComparatorService,
                DiveSchedules, UnitConversion, ReloadDispatcher
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        sut = TestBed.inject(WaypointsDifferenceService);
    });

    // TODO add more real tests on diff of two dive waypoints
    it('No errors comparing waypoints', () => {
        // TODO rename to difference, refactor to property
        const diff = sut.getRows();
        expect(diff).not.toBeNull();
    });
});
