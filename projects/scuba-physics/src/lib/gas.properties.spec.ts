import { GasProperties } from './gas.properties';

describe('Gas properties calculator', () => {
    let sut: GasProperties;

    beforeEach(() => {
        sut = new GasProperties();
        sut.depth = 30;
    });

    it('Trimix 18/45 at surface END is 0 m', () => {
        sut.depth = 0;
        sut.tank.o2 = 18;
        sut.tank.he = 45;
        expect(sut.end).toBeCloseTo(0, 3);
    });

    describe('Air at 30 m', () => {
        beforeEach(() => {
            sut.tank.o2 = 21;
        });

        it('MND is 30 m', () => {
            expect(sut.mnd).toBeCloseTo(30, 3);
        });

        it('END is 30 m', () => {
            expect(sut.end).toBeCloseTo(30, 3);
        });

        it('Minimum depth is 0 m', () => {
            expect(sut.minDepth).toBeCloseTo(0, 3);
        });

        it('Maximum depth (MOD) is 57 m', () => {
            expect(sut.maxDepth).toBeCloseTo(56.986, 3);
        });

        it('Total partial pressure is depth (4 b)', () => {
            expect(sut.totalPp).toBeCloseTo(4, 3);
        });

        it('ppO2 is 0.836', () => {
            expect(sut.ppO2).toBeCloseTo(0.836, 3);
        });

        it('ppHe is 0', () => {
            expect(sut.ppHe).toBeCloseTo(0, 3);
        });

        it('ppN2 is 3.164', () => {
            expect(sut.ppN2).toBeCloseTo(3.164, 3);
        });

        it('Density is 5.15 g/l', () => {
            expect(sut.density).toBeCloseTo(5.151972, 6);
        });
    });

    describe('Trimix 10/70 at 30 m', () => {
        beforeEach(() => {
            sut.tank.o2 = 10;
            sut.tank.he = 70;
        });

        it('MND is 123.3 m', () => {
            expect(sut.mnd).toBeCloseTo(123.333, 3);
        });

        it('END is 2 m', () => {
            expect(sut.end).toBeCloseTo(2, 3);
        });

        it('Minimum depth is 8 m', () => {
            expect(sut.minDepth).toBeCloseTo(8, 3);
        });

        it('Maximum depth (MOD) is 130 m', () => {
            expect(sut.maxDepth).toBeCloseTo(130, 3);
        });

        it('ppO2 is 0.4', () => {
            expect(sut.ppO2).toBeCloseTo(0.4, 3);
        });

        it('ppHe is 2.8', () => {
            expect(sut.ppHe).toBeCloseTo(2.8, 3);
        });

        it('ppN2 is 0.8', () => {
            expect(sut.ppN2).toBeCloseTo(0.8, 3);
        });

        it('Density is 2 g/l', () => {
            expect(sut.density).toBeCloseTo(2.0732, 6);
        });
    });
});
