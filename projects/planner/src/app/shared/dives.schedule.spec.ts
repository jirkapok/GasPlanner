import _ from 'lodash';
import { UnitConversion } from './UnitConversion';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { ReloadDispatcher } from './reloadDispatcher';
import { HighestDensity, ProfileTissues, Time } from 'scuba-physics';

describe('Scheduled dives', () => {
    let sut: DiveSchedules;

    const createSut = (): DiveSchedules => {
        sut = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        return sut;
    };

    beforeEach(() => {
        sut = createSut();
        sut.add();
    });

    it('Has default dive', () => {
        const emptySut = createSut();
        expect(emptySut.length).toEqual(1);
    });

    it('First dive is never repetitive with surface interval POSITIVE_INFINITY', () => {
        const emptySut = createSut();
        emptySut.selected.surfaceInterval = Time.oneMinute * 30;
        expect(emptySut.selected.surfaceInterval).toEqual(Number.POSITIVE_INFINITY);
    });

    it('Dive title respects imperial units setting', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const dive = new DiveSchedule(0, units, new ReloadDispatcher());
        expect(dive.title).toEqual('1. 100 ft, 12 min');
    });

    describe('Selected dive', () => {
        it('it is first by default', () => {
            const emptySut = createSut();
            expect(emptySut.selected).toBe(emptySut.dives[0]);
        });

        it('sets first after remove', () => {
            sut.add();
            sut.selected = sut.dives[2];
            sut.remove(sut.dives[0]);
            expect(sut.selected).toEqual(sut.dives[0]);
        });

        it('sets last after add', () => {
            sut.add();
            const last = sut.dives[sut.length - 1];
            expect(sut.selected).toEqual(last);
        });

        it('Does not change selected if not in current list', () => {
            const toBeSelected = new DiveSchedule(0, new UnitConversion(), new ReloadDispatcher());
            sut.selected = toBeSelected;
            expect(sut.selected).not.toBe(toBeSelected);
        });
    });

    describe('Added dive', () => {
        it('is added to the list', () => {
            expect(sut.length).toEqual(2);
        });

        it('is added as First dive', () => {
            expect(sut.dives[1].surfaceInterval).toEqual(Number.POSITIVE_INFINITY);
        });

        it('has title', () => {
            // this means it has depths and time configured
            expect(sut.dives[1].title).toEqual('2. 30 m, 12 min');
        });

        it('Assigns dive number', () => {
            expect(sut.dives[1].id).toEqual(2);
        });

        it('Rounds to whole meters', () => {
            sut.dives[1].depths.plannedDepth = 31.287;
            const expectedDepth = 31;
            expect(sut.dives[1].title).toEqual(`2. ${expectedDepth} m, 12 min`);
        });
    });

    describe('Remove dive', () => {
        let second: DiveSchedule;

        beforeEach(() => {
            sut.add();
            second = sut.dives[1];
            sut.remove(second);
        });

        it('items are reduced', () => {
            expect(sut.length).toEqual(2);
        });

        it('removed is no longer in the list', () => {
            expect(sut.dives.includes(second)).toBeFalsy();
        });

        it('Does not allow remove last item', () => {
            sut.remove(sut.dives[0]);
            sut.remove(sut.dives[0]);
            sut.remove(sut.dives[0]);
            expect(sut.length).toEqual(1);
        });

        it('Updates ids', () => {
            sut.add();
            sut.remove(sut.dives[1]);
            expect(sut.dives[1].id).toEqual(2);
        });
    });

    describe('Previous dive tissues', () => {
        const sut: DiveSchedules = createSut();
        const loadedTissues = ProfileTissues.createAtSurface();
        sut.byId(1)!.diveResult.updateProfile([], loadedTissues);

        const repetitive = sut.add();
        repetitive.surfaceInterval = Time.oneHour;
        repetitive.diveResult.updateProfile([], ProfileTissues.createAtSurface());

        sut.add();

        const defaultTissues = ProfileTissues.createAtSurface(0);

        it('First dive returns empty tissues', () => {
            const tissues = sut.previousDiveTissues(1)
            expect(tissues).toEqual(defaultTissues);
        });

        it('Repetitive dive returns previous dive tissues', () => {
            const tissues = sut.previousDiveTissues(2)
            expect(tissues).toEqual(loadedTissues);
        });

        it('Non repetitive dive returns empty tissues', () => {
            const tissues = sut.previousDiveTissues(3)
            expect(tissues).toEqual(defaultTissues);
        });

        it('Non existing dive returns empty tissues', () => {
            const tissues = sut.previousDiveTissues(5)
            expect(tissues).toEqual(defaultTissues);
        });
    });

    describe('Calculating', () => {
        it('Marks Still running also all following repetitive dives', (done) => {
            const sut = createSut();
            sut.add();
            const third = sut.add();
            third.surfaceInterval = Time.oneHour;
            sut.add();

            sut.dives.forEach(d => {
                // irrelevant values only to be able mark the dive calculated
                d.diveResult.updateProfile([], ProfileTissues.createAtSurface(0));
                d.diveResult.updateConsumption(0, 0, 0, 0, 0, false, false);
                d.diveResult.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
            });

            sut.markStart(2);

            setTimeout(() => {
                const states = _(sut.dives).map(d => d.diveResult.calculated).value();
                expect(states).toEqual([ true, false, false, true ]);
                done();
            }, 500);
        });
    });
});
