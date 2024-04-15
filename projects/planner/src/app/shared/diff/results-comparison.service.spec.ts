import { TestBed } from '@angular/core/testing';
import { DiveSchedules } from '../dive.schedules';
import { ProfileComparatorService } from './profileComparatorService';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { ResultDiff, ResultsComparison } from './results-comparison.service';
import { DiveResults } from '../diveresults';

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
        const selection = TestBed.inject(ProfileComparatorService);
        selection.selectProfile(2);
    });

    const assertResultsDiff = (resultsDiff: ResultDiff, expectedB: number) => {
        expect(resultsDiff.valueA).toBeCloseTo(0, 6);
        expect(resultsDiff.valueB).toBeCloseTo(expectedB, 6);
    };

    it('cns', () => {
        profileB.cns = 80;
        assertResultsDiff(sut.cns, 80);
    });

    it('otu', () => {
        profileB.otu = 81;
        assertResultsDiff(sut.otu, 81);
    });

    it('Time to surface', () => {
        profileB.timeToSurface = 82;
        assertResultsDiff(sut.timeToSurface, 82);
    });

    it('Emergency ascent starts', () => {
        profileB.emergencyAscentStart = 83;
        assertResultsDiff(sut.emergencyAscentStart, 83);
    });

    it('No deco limit', () => {
        profileB.noDecoTime = 84;
        assertResultsDiff(sut.noDeco, 84);
    });

    it('Max time', () => {
        profileB.maxTime = 85;
        assertResultsDiff(sut.maxTime, 85);
    });

    it('Average depth', () => {
        profileB.averageDepth = 86;
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
            profileB.averageDepth = 30;
            assertResultsDiff(sut.averageDepth,  98.4251969);
        });

        it('Max density lb/cuft', () => {
            profileB.highestDensity.density = 6;
            assertResultsDiff(sut.highestDensity, 0.374568);
        });
    });
});
