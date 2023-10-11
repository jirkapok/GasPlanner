import { UnitConversion } from './UnitConversion';
import { DiveSchedule, DivesSchedule } from './dives.schedule';

describe('Scheduled dives', () => {
    let sut: DivesSchedule;

    beforeEach(() => {
        sut = new DivesSchedule(new UnitConversion());
        sut.add();
    });

    it('Has default dive', () => {
        const emptySut = new DivesSchedule(new UnitConversion());
        expect(emptySut.length).toEqual(1);
    });

    describe('Selected dive', () => {
        it('it is first by default', () => {
            expect(sut.selected).toEqual(sut.dives[0]);
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
            const toBeSelected = new DiveSchedule(new UnitConversion());
            sut.selected = toBeSelected;
            expect(sut.selected).not.toBe(toBeSelected);
        });
    });

    describe('Added dive', () => {
        it('is added to the list', () => {
            expect(sut.length).toEqual(2);
        });

        it('is added as First dive', () => {
            expect(sut.dives[1].surfaceInterval).toBeUndefined();
        });

        it('has title', () => {
            // this means it has depths and time configured
            expect(sut.dives[1].title).toEqual('12 min/30 m');
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
    });

    // TODO Scheduled dives test cases:
    // * any change in dive list triggers save preferences
    // * New dive is loaded from default dive
    // * Dives are loaded from saved storage
});
