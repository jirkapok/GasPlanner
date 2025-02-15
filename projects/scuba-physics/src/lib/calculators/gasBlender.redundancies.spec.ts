import { GasBlender } from './gasBlender';

describe('Gas Blender - Redundancies', () => {
    describe('Validation', () => {
        it('Tank A start pressure invalid value throws', () => {
            const tankA = {
                startPressure: -1,
                size: 0
            };
            const tankB = {
                startPressure: 10,
                size: 10
            };

            expect(() => GasBlender.redundancies(tankA, tankB)).toThrow();
        });

        it('Tank B volume invalid value throws', () => {
            const tankA = {
                startPressure: 10,
                size: 0
            };
            const tankB = {
                startPressure: 10,
                size: -1
            };

            expect(() => GasBlender.redundancies(tankA, tankB)).toThrow();
        });
    });

    it('0 l volume in tankA returns tankB pressure', () => {
        const tankA = {
            startPressure: 10,
            size: 0
        };
        const tankB = {
            startPressure: 10,
            size: 10
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(10);
    });

    it('0 l volume in tankB returns tankA pressure', () => {
        const tankA = {
            startPressure: 10,
            size: 10
        };
        const tankB = {
            startPressure: 10,
            size: 0
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(10);
    });

    it('No volume in any tankB returns 0 bar pressure', () => {
        const tankA = {
            startPressure: 10,
            size: 0
        };
        const tankB = {
            startPressure: 10,
            size: 0
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(0);
    });

    it('Identical pressure in both different tanks combines total volume', () => {
        const tankA = {
            startPressure: 50,
            size: 10
        };
        const tankB = {
            startPressure: 50,
            size: 20
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(50);
    });

    it('Different pressure in both identical tanks combines gas volume', () => {
        const tankA = {
            startPressure: 100,
            size: 10
        };
        const tankB = {
            startPressure: 50,
            size: 10
        };

        const finalPressure = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure).toBeCloseTo(74.834818, 6); // 75 b ideal gas law
    });

    it('Different pressure in both different tanks combines gas volume', () => {
        const tankA = {
            startPressure: 232,
            size: 24
        };
        const tankB = {
            startPressure: 50,
            size: 11.1
        };

        const finalPressure2 = GasBlender.redundancies(tankA, tankB);
        expect(finalPressure2).toBeCloseTo(169.636306, 6); // 174.4 b ideal gas law
    });
});
