import { EventsFactory, EventType, StandardGases, Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { BoundEvent, TankBound } from './models';

describe('Bound tank', () => {
    const units: UnitConversion = new UnitConversion();
    let tank: TankBound;

    beforeEach(() => {
        units.imperialUnits = false;
        tank = new TankBound(Tank.createDefault(), units);
    });

    it('Generates Label', () => {
        tank.id = 3;
        expect(tank.label).toBe('3. Air/15/200');
    });

    it('Working pressure can\'t be NaN', () => {
        tank.workingPressure = NaN;
        expect(tank.workingPressure).not.toBeNaN();
    });

    it('Rounds size to one decimal', () => {
        tank.size = 12.354;
        expect(tank.size).toBe(12.4);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            units.imperialUnits = true;
            tank = new TankBound(Tank.createDefault(), units);
        });

        it('Rounds label depending on units', () => {
            expect(tank.label).toBe('0. Air/125.7/2900.8');
        });

        it('Rounds size to one decimal in cuft', () => {
            tank.size = 80.0789;
            expect(tank.size).toBeCloseTo(80.1, 10);
        });

        it('Set Working pressure keeps unrounded size', () => {
            const expectedSize = tank.size;
            tank.workingPressure = 3000;
            expect(tank.size).toBeCloseTo(expectedSize, 6);
        });

        it('Set Working pressure keeps target size', () => {
            const expectedSize = 160;
            tank.size = expectedSize;
            tank.workingPressure = 3000;
            expect(tank.size).toBeCloseTo(expectedSize, 6);
        });
    });
});

describe('BoundEvent', () => {
    it('Exposes event type', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createHighPpO2(10, 20));
        expect(sut.type).toEqual(EventType.highPpO2);
    });

    it('Depth in meters with imperial units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const sut = new BoundEvent(units, EventsFactory.createHighPpO2(10, 20));
        expect(sut.depthMeters).toEqual(20);
    });

    it('Gas name of gas switch', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createGasSwitch(10, 21, StandardGases.ean50));
        expect(sut.gasName).toEqual('EAN50');
    });

    it('Empty gas name for event without gas', () => {
        const sut = new BoundEvent(new UnitConversion(), EventsFactory.createHighPpO2(10, 20));
        expect(sut.gasName).toEqual('');
    });
});
