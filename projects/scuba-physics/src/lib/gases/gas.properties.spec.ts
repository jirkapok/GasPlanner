import { GasProperties } from './gas.properties';

describe('Gas properties calculator', () => {
    let sut: GasProperties;

    beforeEach(() => {
        sut = new GasProperties();
        sut.depth = 30;
    });

    it('Ead for oxygen at 10 m is 0 m', () => {
        sut.depth = 0;
        sut.tank.o2 = 50;
        sut.tank.he = 0;
        sut.depth = 5;
        expect(sut.ead).toBeCloseTo(0, 3);
    });

    it('Trimix 18/45 at surface END is 0 m', () => {
        sut.depth = 0;
        sut.tank.o2 = 18;
        sut.tank.he = 45;
        expect(sut.end).toBeCloseTo(0, 3);
    });

    describe('Settings', () => {
        it('Narcotic depth is used', () => {
            sut.narcoticDepthLimit = 40;
            expect(sut.mnd).toBeCloseTo(40, 3);
        });

        it('Maximum partial pressure is used', () => {
            sut.maxPpO2 = 1.3;
            expect(sut.maxDepth).toBeCloseTo(52.201, 3);
        });

        it('Is oxygen narcotic is used for mnd', () => {
            sut.oxygenNarcotic = false;
            expect(sut.mnd).toBeCloseTo(40.569, 3);
        });

        it('Is oxygen narcotic is used for end', () => {
            sut.oxygenNarcotic = false;
            expect(sut.end).toBeCloseTo(21.64, 3);
        });
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

        it('Maximum narcotic depth is 30 m', () => {
            expect(sut.narcoticDepthLimit).toBeCloseTo(30, 3);
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

        it('Default narcotic depth limit', () => {
            expect(sut.narcoticDepthLimit).toBeCloseTo(30, 6);
        });

        describe('Limits', () => {
            it('Not exceeded density', () => {
                expect(sut.densityExceeded).toBeFalsy();
            });

            it('Not exceeded mnd', () => {
                expect(sut.mndExceeded).toBeFalsy();
            });

            it('Not exceeded min. ppO2', () => {
                expect(sut.minPpO2Exceeded).toBeFalsy();
            });

            it('Not exceeded max. ppO2', () => {
                expect(sut.maxPpO2Exceeded).toBeFalsy();
            });
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

    describe('Exceeded limits', () => {
        it('Exceeds density', () => {
            sut.depth = 42;
            expect(sut.densityExceeded).toBeTruthy();
        });

        it('Exceeds mnd', () => {
            sut.depth = 42;
            expect(sut.mndExceeded).toBeTruthy();
        });

        it('Exceeds min. ppO2', () => {
            sut.depth = 3;
            sut.tank.o2 = 10;
            expect(sut.minPpO2Exceeded).toBeTruthy();
        });

        it('Exceeds max. ppO2', () => {
            sut.depth = 70;
            expect(sut.maxPpO2Exceeded).toBeTruthy();
        });
    });
});
