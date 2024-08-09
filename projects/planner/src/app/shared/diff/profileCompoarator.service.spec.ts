import { inject, TestBed } from '@angular/core/testing';
import { DiveSchedules } from '../dive.schedules';
import { ProfileComparatorService } from './profileComparatorService';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { ConsumptionByMix, IConsumedMix, Segment, StandardGases, Tank } from 'scuba-physics';
import { WayPoint } from '../wayPoint';

describe('ProfileComparison service', () => {
    let sut: ProfileComparatorService;
    let schedules: DiveSchedules;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                ProfileComparatorService, UnitConversion,
                ReloadDispatcher, DiveSchedules,
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        sut = TestBed.inject(ProfileComparatorService);
        schedules = TestBed.inject(DiveSchedules);
    });

    it('Only 1 dive compares with it self', () => {
        expect(sut.profileAIndex).toEqual(0);
        expect(sut.profileBIndex).toEqual(0);
    });

    it('Two dives compares first two dives', () => {
        schedules.add();
        const newSut = new ProfileComparatorService(schedules, new ReloadDispatcher());
        expect(newSut.profileAIndex).toEqual(0);
        expect(newSut.profileBIndex).toEqual(1);
    });

    it('Has only one profile', () => {
        expect(sut.hasTwoProfiles).toBeFalsy();
    });

    it('Has two profiles', () => {
        schedules.add();
        expect(sut.hasTwoProfiles).toBeTruthy();
    });

    it('Total duration of one dive', inject([UnitConversion], (units: UnitConversion) => {
        schedules.selected.diveResult.wayPoints = [
            WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 600))
        ];

        expect(sut.totalDuration).toEqual(600);
    }));

    it('Total duration Profile B dive', inject([UnitConversion], (units: UnitConversion) => {
        schedules.add();
        schedules.dives[0].diveResult.wayPoints = [
            WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 500))
        ];

        schedules.dives[1].diveResult.wayPoints = [
            WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 700))
        ];

        sut.selectProfile(1);

        expect(sut.totalDuration).toEqual(700);
    }));

    describe('Tanks combined consumption', () => {
        let combineMethod: jasmine.Spy<(tanks: Tank[]) => IConsumedMix[]>;

        beforeEach(() => {
            schedules.add();
            schedules.dives[0].tanksService.tankData[0].consumed = 50;
            schedules.dives[1].tanksService.tankData[0].consumed = 100;
            sut.selectProfile(1);
            combineMethod = spyOn(ConsumptionByMix, 'combine')
                .and.callThrough();
        });

        it('profileACombinedTanks call combined consumption for Profile A', () => {
            const _ = sut.profileAConsumed;
            expect(combineMethod).toHaveBeenCalledWith(sut.profileA.tanksService.tankData);
        });

        it('profileBCombinedTanks call combined consumption for Profile B', () => {
            const _ = sut.profileBConsumed;
            expect(combineMethod).toHaveBeenCalledWith(sut.profileB.tanksService.tankData);
        });
    });

    describe('Handles only calculated profiles', () => {
        it('By default Not calculated profiles', () => {
            expect(sut.profilesCalculated).toBeFalsy();
        });

        it('Dive profiles are already calculated', () => {
            sut.profileAResults.profileFinished();
            sut.profileBResults.profileFinished();
            expect(sut.profilesCalculated).toBeTruthy();
        });

        it('Dive results are already calculated', () => {
            sut.profileAResults.diveInfoFinished();
            sut.profileAResults.consumptionFinished();
            sut.profileBResults.diveInfoFinished();
            sut.profileBResults.consumptionFinished();
            expect(sut.bothResultsCalculated).toBeTruthy();
        });

        it('Consumption are already calculated', () => {
            sut.profileAResults.consumptionFinished();
            sut.profileBResults.consumptionFinished();
            expect(sut.showConsumption).toBeTruthy();
        });
    });

    describe('Select new profile', () => {
        const expectedA = 2;
        const expectedB = 1;
        let eventNoticedTimes = 0;

        beforeEach(() => {
            schedules.add();
            schedules.add();

            eventNoticedTimes = 0;
            sut.selectionChanged$.subscribe(() => eventNoticedTimes++);
            sut.selectProfile(expectedA);
            sut.selectProfile(expectedB);
        });

        it('Selects Profile', () => {
            expect(sut.profileAIndex).toEqual(expectedA);
            expect(sut.profileBIndex).toEqual(expectedB);
        });

        it('Selection change event received', () => {
            expect(eventNoticedTimes).toEqual(2);
        });

        it('Switch already selected profiles', () => {
            sut.selectProfile(expectedB);

            expect(sut.profileAIndex).toEqual(expectedB);
            expect(sut.profileBIndex).toEqual(expectedA);
        });

        it('Remove selected profile A resets selection to first profile', () => {
            const added = schedules.add();
            sut.selectProfile(added.index -1);
            sut.selectProfile(added.index);
            schedules.remove(added);
            schedules.remove(schedules.dives[2]);

            expect(sut.profileAIndex).toEqual(0);
            expect(sut.profileBIndex).toEqual(0);
        });
    });
});
