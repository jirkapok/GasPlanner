import { TestBed } from '@angular/core/testing';
import { DiveSchedules } from '../dive.schedules';
import { ProfileComparatorService } from './profileComparatorService';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { ResultDiff, ResultsComparison } from './results-comparison.service';
import { DiveResults } from '../diveresults';
import { HighestDensity } from "scuba-physics";

describe('ResultsComparison service current values', () => {
    let sut: ResultsComparison;
    let schedules: DiveSchedules;
    let profileB: DiveResults;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                ProfileComparatorService, UnitConversion,
                ReloadDispatcher, DiveSchedules,
                ResultsComparison
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        sut = TestBed.inject(ResultsComparison);
        schedules = TestBed.inject(DiveSchedules);

        schedules.add();
        profileB = schedules.add().diveResult;
        profileB.updateDiveInfo(84, false, 0, 86, 0, 0, 0, 81, 80, HighestDensity.createDefault(), [], [], []);
        profileB.updateConsumption(85, 82, 83, 0, 0, false, false, []);
        const selection = TestBed.inject(ProfileComparatorService);
        selection.selectProfile(2);
    });

    const assertResultsDiff = (resultsDiff: ResultDiff, expectedB: number) => {
        expect(resultsDiff.valueA).toBeCloseTo(0, 6);
        expect(resultsDiff.valueB).toBeCloseTo(expectedB, 6);
    };

    it('cns', () => {
        assertResultsDiff(sut.cns, 80);
    });

    it('otu', () => {
        assertResultsDiff(sut.otu, 81);
    });

    it('Time to surface', () => {
        assertResultsDiff(sut.timeToSurface, 82);
    });

    it('Emergency ascent starts', () => {
        assertResultsDiff(sut.emergencyAscentStart, 83);
    });

    it('No deco limit', () => {
        assertResultsDiff(sut.noDeco, 84);
    });

    it('Max time', () => {
        assertResultsDiff(sut.maxTime, 85);
    });

    it('Average depth', () => {
        assertResultsDiff(sut.averageDepth, 86);
    });

    it('Max density', () => {
        profileB.highestDensity.density = 6;
        assertResultsDiff(sut.highestDensity, 6);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
        });

        it('Average depth ft', () => {
            profileB.updateDiveInfo(84, false, 0, 30, 0, 0, 0, 81, 80, HighestDensity.createDefault(), [], [], []);
            assertResultsDiff(sut.averageDepth,  98.4251969);
        });

        it('Max density lb/cuft', () => {
            profileB.highestDensity.density = 6; // highest density should be readonly
            assertResultsDiff(sut.highestDensity, 0.374568);
        });
    });
});
