import { UnitConversion } from './UnitConversion';
import { DivesSchedule } from './dives.schedule';

describe('Scheduled dives', () => {
    let sut: DivesSchedule;

    beforeEach(() => {
        sut = new DivesSchedule(new UnitConversion());
    });

    it('Has default dive', () => {
        expect(sut.dives.length).toEqual(1);
    });

    describe('Added dive', () => {
        beforeEach(() => {
            sut.add();
        });

        it('is added to the list', () => {
            expect(sut.dives.length).toEqual(2);
        });

        it('is added as First dive', () => {
            expect(sut.dives[1].surfaceInterval).toBeUndefined();
        });

        it('has title', () => {
            // this means it has depths and time configured
            expect(sut.dives[1].title).toEqual('12 min/30 m');
        });
    });

    it('Dive is removed from the list', () => {
        sut.add();
        sut.add();
        const second = sut.dives[1];
        sut.remove(second);

        expect(sut.dives.length).toEqual(2);
        expect(sut.dives.includes(second)).toBeFalsy();
    });

    // TODO Scheduled dives test cases:
    // * any change in dive list triggers save preferences
    // * New dive is loaded from default dive
    // * Dives are loaded from saved storage
});
