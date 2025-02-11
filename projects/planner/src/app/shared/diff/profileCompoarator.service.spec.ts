import { inject, TestBed } from '@angular/core/testing';
import { DiveSchedules } from '../dive.schedules';
import { ProfileComparatorService } from './profileComparatorService';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import {
    ConsumptionByMix, FeatureFlags, HighestDensity,
    IConsumedMix, ProfileTissues, Segment,
    StandardGases, Tank
} from 'scuba-physics';
import { WayPoint } from '../wayPoint';
import { PlannerService } from '../planner.service';
import { ViewSwitchService } from "../viewSwitchService";
import { ApplicationSettingsService } from "../ApplicationSettings";
import { WorkersFactoryCommon } from "../serial.workers.factory";

describe('ProfileComparison service', () => {
    const irrelevantTissues = ProfileTissues.createAtSurface(0);
    let sut: ProfileComparatorService;
    let schedules: DiveSchedules;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                ProfileComparatorService, UnitConversion,
                ReloadDispatcher, DiveSchedules,
                PlannerService, ViewSwitchService,
                ApplicationSettingsService, WorkersFactoryCommon
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
        schedules.selected.diveResult.updateProfile([
             WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 600))
        ], irrelevantTissues);

        expect(sut.totalDuration).toEqual(600);
    }));

    it('Total duration Profile B dive', inject([UnitConversion], (units: UnitConversion) => {
        schedules.add();
        schedules.dives[0].diveResult.updateProfile([
             WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 500))
        ], irrelevantTissues);

        schedules.dives[1].diveResult.updateProfile([
             WayPoint.fromSegment(units, new Segment(0,0, StandardGases.air, 700))
         ], irrelevantTissues);

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
            sut.profileAResults.updateProfile([], irrelevantTissues);
            sut.profileBResults.updateProfile([], irrelevantTissues);
            expect(sut.profilesCalculated).toBeTruthy();
        });

        it('Dive results are already calculated', () => {
            sut.profileAResults.updateConsumption(0, 0, 0, 0, 0, false, false);
            sut.profileAResults.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
            sut.profileBResults.updateConsumption(0, 0, 0, 0, 0, false, false);
            sut.profileBResults.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
            expect(sut.bothResultsCalculated).toBeTruthy();
        });

        it('Consumption are already calculated', () => {
            sut.profileAResults.updateConsumption(0, 0, 0, 0, 0, false, false);
            sut.profileBResults.updateConsumption(0, 0, 0, 0, 0, false, false);
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

    it('Tissue saturation Both have the same amount of samples', () => {
        schedules.add();
        schedules.dives[1].depths.planDuration = 14;
        sut.selectProfile(1);
        const planner = TestBed.inject(PlannerService);
        // needed to get the final over pressures
        planner.calculate(1);
        planner.calculate(2);

        const overPressures = sut.overPressures;
        const lengthB = overPressures.profileAOverPressures.length;
        const lengthA = overPressures.profileBOverPressures.length;
        expect(lengthA).toEqual(lengthB);
    });
});
