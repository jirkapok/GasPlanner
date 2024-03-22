import { TestBed } from '@angular/core/testing';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from '../dive.schedules';
import { UnitConversion } from '../UnitConversion';
import { ReloadDispatcher } from '../reloadDispatcher';
import { GasesComparisonService } from './gases-comparison.service';

describe('GasesComparisonService', () => {
    let sut: GasesComparisonService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                GasesComparisonService,
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]
        }).compileComponents();

        sut = TestBed.inject(GasesComparisonService);
    });

    // TODO test cases GasesComparisonService:
    // * imperial units
    // * complement gases
    // * equal number of gases
    // * no gas? it is not possible, but check current behavior
    it('Creates compared gases', () => {
        expect(sut.gasesDifference).not.toBeNull();
    });
});
