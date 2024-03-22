import { inject, TestBed } from '@angular/core/testing';
import { DiveSchedules } from './dive.schedules';
import { ProfileComparatorService } from './profileComparatorService';
import { ReloadDispatcher } from './reloadDispatcher';
import { UnitConversion } from './UnitConversion';
import { WayPoint } from './models';
import { ConsumptionByMix, IConsumedMix, Segment, StandardGases, Tank } from 'scuba-physics';

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

    it('Has default dives', () => {
        expect(sut.profileA).toEqual(schedules.dives[0]);
        expect(sut.profileB).toEqual(schedules.dives[0]);
    });

    it('Has only one profile', () => {
        expect(sut.hasTwoProfiles()).toBeFalsy();
    });

    // TODO add reaction on event when profile was removed
    // TODO remove hasTwoProfiles or use it: initial load of the component, if there is only one profile select as both
    // if there are at least two select second as B
    //  change it to get property and all other properties in the service
    it('Has two profiles', () => {
        schedules.add();
        expect(sut.hasTwoProfiles()).toBeTruthy();
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

    // TODO rename to Consumption profileACombinedTanks, profileBCombinedTanks
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
            const _ = sut.profileACombinedTanks;
            expect(combineMethod).toHaveBeenCalledWith(sut.profileA.tanksService.tankData);
        });

        it('profileBCombinedTanks call combined consumption for Profile B', () => {
            const _ = sut.profileBCombinedTanks;
            expect(combineMethod).toHaveBeenCalledWith(sut.profileB.tanksService.tankData);
        });
    });

    describe('Handles only calculated profiles', () => {
        // TODO areProfilesCalculated change to property
        // TODO switch waitUntilProfilesCalculated to use events from Dispatcher the drawing components
        it('Waits until profiles are calculated', async() => {
            let eventReceived = false;
            sut.profileAResults.showStillRunning();

            setTimeout(() => {
                sut.profileAResults.profileFinished();
            }, 110); // more than the service waits

            await sut.waitUntilProfilesCalculated().then(() => {
                eventReceived = true;
            });

            expect(eventReceived).toBeTruthy();
        });

        it('By default Not calculated profiles', () => {
            expect(sut.areProfilesCalculated()).toBeFalsy();
        });

        it('Profiles are already calculated', () => {
            // TODO distinguish profile calculated, consumption and diveInfo
            sut.profileAResults.profileFinished();
            sut.profileBResults.profileFinished();
            expect(sut.areProfilesCalculated()).toBeTruthy();
        });
    });

    // TODO add switch when clicking on already selected profile swithes profiles
    // TODO change buttons colors to select profile: Try ProfileB to be green and selected profiles gray, not selected white
    describe('Select new profile', () => {
        const expectedA = 2;
        const expectedB = 1;
        let newProfileA = -1; // set to non existing index
        let newProfileB = -1;

        beforeEach(() => {
            schedules.add();
            schedules.add();

            // TODO rename to ProfileAChanged and dont create new one, but initialize in constructor
            sut.profileAIndex.subscribe((newIndex: number) => newProfileA = newIndex);
            sut.profileBIndex.subscribe((newIndex: number) => newProfileB = newIndex);

            // TODO remove appendProfileToProfileComparison method return value
            sut.selectProfile(expectedA);
            sut.selectProfile(expectedB);
        });

        it('Selects Profile', () => {
            expect(sut.profileA).toEqual(schedules.dives[expectedA]);
            expect(sut.profileB).toEqual(schedules.dives[expectedB]);
        });

        it('Profile A change event received', () => {
            expect(newProfileA).toEqual(expectedA);
        });

        it('Profile B change event received', () => {
            expect(newProfileB).toEqual(expectedB);
        });
    });
});

