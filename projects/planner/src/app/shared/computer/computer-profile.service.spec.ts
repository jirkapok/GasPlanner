import { TestBed } from '@angular/core/testing';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { ComputerData } from './computer.model';
import { ComputerProfileService } from './computer-profile.service';

describe('ComputerProfileService', () => {
    let sut: ComputerProfileService;
    let schedules: DiveSchedules;
    let dispatcher: ReloadDispatcher;
    let units: UnitConversion;
    let published: ComputerData[];

    /** Simulates PlannerService finishing calculation of a dive with given duration in seconds */
    const calculate = (dive: DiveSchedule, duration: number): void => {
        const results = dive.diveResult;
        results.start();
        results.updateProfile([WayPoint.fromSegment(units, new Segment(0, 0, StandardGases.air, duration))],
            ProfileTissues.createAtSurface(0));
        results.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
        results.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        dispatcher.sendInfoCalculated(dive.id);
    };

    const lastPublished = (): ComputerData => published[published.length - 1];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ComputerProfileService, DiveSchedules, ReloadDispatcher, UnitConversion]
        });

        schedules = TestBed.inject(DiveSchedules);
        dispatcher = TestBed.inject(ReloadDispatcher);
        units = TestBed.inject(UnitConversion);
        sut = TestBed.inject(ComputerProfileService);
        published = [];
        sut.computerData$.subscribe(d => published.push(d));
    });

    it('Selects first dive by default', () => {
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(sut.selectedIndex).toEqual(0);
    });

    it('Selects first dive by default even if planner selected another dive', () => {
        schedules.add(); // DiveSchedules.add selects the added dive in the planner
        const newSut = new ComputerProfileService(schedules, dispatcher);
        expect(newSut.selectedDive).toBe(schedules.dives[0]);
    });

    it('Publishes empty data when selected dive is not calculated', () => {
        expect(published.length).toEqual(1);
        expect(lastPublished().profile).toEqual([]);
    });

    it('Recalculates when selected dive is calculated', () => {
        calculate(schedules.dives[0], 10);
        expect(lastPublished().profile.length).toEqual(11);
        expect(sut.computerData).toBe(lastPublished());
    });

    it('Publishes empty data when calculation failed', () => {
        const first = schedules.dives[0];
        calculate(first, 10);
        first.diveResult.endFailed();
        dispatcher.sendInfoCalculated(first.id);
        expect(lastPublished().profile).toEqual([]);
    });

    it('Ignores calculation of not selected dive', () => {
        const second = schedules.add();
        const countBefore = published.length;
        calculate(second, 10);
        expect(published.length).toEqual(countBefore);
        expect(sut.selectedDive).toBe(schedules.dives[0]);
    });

    it('Recalculates when other dive selected', () => {
        const second = schedules.add();
        calculate(second, 20);
        sut.select(1);
        expect(sut.selectedDive).toBe(second);
        expect(sut.selectedIndex).toEqual(1);
        expect(lastPublished().profile.length).toEqual(21);
    });

    it('Selecting already selected dive does not recalculate', () => {
        const countBefore = published.length;
        sut.select(0);
        expect(published.length).toEqual(countBefore);
    });

    it('Ignores out of range selection', () => {
        const countBefore = published.length;
        sut.select(-1);
        sut.select(1);
        expect(sut.selectedIndex).toEqual(0);
        expect(published.length).toEqual(countBefore);
    });

    it('Ignores planner selection', () => {
        schedules.add();
        const countBefore = published.length;
        schedules.setSelectedIndex(1); // fires selectedChanged$
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(published.length).toEqual(countBefore);
    });

    it('Selects first dive when selected dive removed', () => {
        const first = schedules.dives[0];
        calculate(first, 10);
        const second = schedules.add();
        calculate(second, 30);
        sut.select(1);
        schedules.remove(second); // fires depthChanged$
        expect(sut.selectedDive).toBe(first);
        expect(lastPublished().profile.length).toEqual(11);
    });

    it('Keeps selection when other dive removed', () => {
        const second = schedules.add();
        const third = schedules.add();
        calculate(third, 30);
        sut.select(2);
        const countBefore = published.length;
        schedules.remove(second);
        expect(sut.selectedDive).toBe(third);
        expect(sut.selectedIndex).toEqual(1);
        expect(published.length).toEqual(countBefore);
    });

    it('Selects first dive when selected dive cleared without depth change event', () => {
        schedules.add();
        sut.select(1);
        schedules.clear(); // used when all dives are reloaded, fires no event
        calculate(schedules.dives[0], 10);
        expect(sut.selectedDive).toBe(schedules.dives[0]);
        expect(lastPublished().profile.length).toEqual(11);
    });
});
