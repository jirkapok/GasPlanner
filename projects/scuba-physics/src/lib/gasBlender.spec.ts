import { GasBlender, TankFill } from './gasBlender';

describe('Gas Blender', () => {
    it('0 l volume in tankA returns tankB pressure', () => {
        const tankA = {
            startPressure: 10,
            volume: 0
        };
        const tankB = {
            startPressure: 10,
            volume: 10
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(10);
    });

    it('0 l volume in tankB returns tankA pressure', () => {
        const tankA = {
            startPressure: 10,
            volume: 10
        };
        const tankB = {
            startPressure: 10,
            volume: 0
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(10);
    });

    it('No volume in any tankB returns 0 bar pressure', () => {
        const tankA = {
            startPressure: 10,
            volume: 0
        };
        const tankB = {
            startPressure: 10,
            volume: 0
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(0);
    });

    it('Identical pressure in both different tanks combines total volume', () => {
        const tankA = {
            startPressure: 50,
            volume: 10
        };
        const tankB = {
            startPressure: 50,
            volume: 20
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(50);
    });

    it('Different pressure in both identical tanks combines gas volume', () => {
        const tankA = {
            startPressure: 100,
            volume: 10
        };
        const tankB = {
            startPressure: 50,
            volume: 10
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(75);
    });

    it('Different pressure in both different tanks combines gas volume', () => {
        const tankA = {
            startPressure: 100,
            volume: 24
        };
        const tankB = {
            startPressure: 40,
            volume: 12
        };

        const finalPressure2 = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure2).toBeCloseTo(80, 6);
    });
});
