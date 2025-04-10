import { Tank } from './Tanks';
import { StandardGases } from '../gases/StandardGases';

describe('Tank', () => {
    let tank: Tank;

    beforeEach(() => {
        tank = Tank.createDefault();
    });

    describe('Gas content precision', () => {
        it('Fixes O2 29%', () => {
            tank.o2 = 29;
            expect(tank.o2).toBe(29);
        });

        it('Fixes He 29%', () => {
            tank.he = 29;
            expect(tank.he).toBe(29);
        });

        describe('Pins Air O2', () => {
            it('Pins 21 % to 0.209 fO2', () => {
                tank.o2 = 21;
                expect(tank.gas.fO2).toBeCloseTo(0.209, 3);
            });

            it('Unpins from 0.209 fO2 to 21 %', () => {
                tank.gas.fO2 = 0.209;
                expect(tank.o2).toBeCloseTo(21, 3);
            });
        });

        describe('N2 content', () => {
            it('N2 fills rest of the content for pinned O2', () => {
                tank.o2 = 21;
                expect(tank.n2).toBeCloseTo(79, 3);
            });

            it('N2 fills rest of the content', () => {
                tank.o2 = 10;
                tank.he = 70;
                expect(tank.n2).toBeCloseTo(20, 3);
            });
        });

        describe('Not pining Air O2 for trimix', () => {
            it('Does not apply 21 % 02', () => {
                tank.he = 10;
                tank.o2 = 21;
                expect(tank.gas.fO2).toBeCloseTo(0.21, 3);
            });

            it('0.209 O2 is not affected', () => {
                tank.he = 10;
                tank.gas.fO2 = 0.209;
                expect(tank.o2).toBeCloseTo(20.9, 3);
            });
        });
    });

    describe('Full', () => {
        it('has nothing consumed', () => {
            expect(tank.endPressure).toBe(200);
        });

        it('has reserve', () => {
            expect(tank.hasReserve).toBeTruthy();
        });

        it('percent remaining is 100', () => {
            expect(tank.percentsRemaining).toBe(100);
        });

        it('percent rock bottom is 0', () => {
            expect(tank.percentsReserve).toBe(0);
        });
    });

    describe('Empty', () => {
        beforeEach(() => {
            tank.consumed = 200;
            tank.reserve = 50;
        });

        it('empty end pressure 100', () => {
            expect(tank.endPressure).toBe(0);
        });

        it('has not reserve', () => {
            expect(tank.hasReserve).toBeFalsy();
        });

        it('percent remaining is 0', () => {
            expect(tank.percentsRemaining).toBe(0);
        });

        it('empty percent rock bottom is 25', () => {
            expect(tank.percentsReserve).toBe(25);
        });
    });

    describe('Consumed, but still reserve', () => {
        beforeEach(() => {
            tank.consumed = 100;
            tank.reserve = 50;
        });

        it('end pressure 100', () => {
            expect(tank.endPressure).toBe(100);
        });

        it('consumed has reserve', () => {
            expect(tank.hasReserve).toBeTruthy();
        });

        it('percent remaining is 50', () => {
            expect(tank.percentsRemaining).toBeCloseTo(50, 1);
        });

        it('percent rock bottom is 25', () => {
            expect(tank.percentsReserve).toBe(25);
        });
    });

    describe('Consumed more than reserve', () => {
        beforeEach(() => {
            tank.consumed = 150;
            tank.reserve = 100;
        });

        it('end pressure 50', () => {
            expect(tank.endPressure).toBe(50);
        });

        it('has no reserve', () => {
            expect(tank.hasReserve).toBeFalsy();
        });

        it('percent remaining is 25', () => {
            expect(tank.percentsRemaining).toBe(25);
        });

        it('percent rock bottom is 50', () => {
            expect(tank.percentsReserve).toBeCloseTo(50, 1);
        });
    });

    describe('Sets only valid values', () => {
        describe('Start pressure', () => {
            it('can`t be negative', () => {
                tank.startPressure = -100;
                expect(tank.startPressure).toBe(0);
            });

            it('prevents minimum 0 b end pressure', () => {
                tank.consumed = 150;
                tank.startPressure = 100;
                expect(tank.endPressure).toBe(0);
                expect(tank.consumed).toBe(100);
            });

            it('preserves consumed volume', () => {
                tank.consumed = 50;
                tank.startPressure = 150;
                expect(tank.endPressure).toBe(100);
                expect(tank.consumed).toBe(50);
            });
        });

        describe('Size', () => {
            it('can`t be negative', () => {
                tank.size = -10;
                expect(tank.size).toBe(0.1);
            });

            it('prevents minimum 0 b end pressure', () => {
                tank.consumed = 150;
                tank.size = 5;
                expect(tank.endPressure).toBe(0);
                expect(tank.consumed).toBe(200);
            });

            it('preserves consumed volume', () => {
                tank.consumed = 50;
                tank.size = 7.5;
                expect(tank.endPressure).toBe(99);
                expect(tank.consumed).toBe(101);
            });
        });

        describe('Consumed', () => {
            it('Set more than available sets only available', () => {
                tank.consumed = 300;
                expect(tank.consumed).toBe(200);
            });

            it('Set negative amount sets 0 bars consumed', () => {
                tank.consumed = -100;
                expect(tank.consumed).toBe(0);
            });
        });

        describe('Consumed Volume', () => {
            it('Can`t set negative consumed volume', () => {
                tank.consumedVolume = -300;
                expect(tank.consumedVolume).toBe(0);
                expect(tank.consumed).toBe(0);
            });

            it('Sets corresponding volume', () => {
                tank.consumedVolume = 1500;
                expect(tank.consumedVolume).toBe(1500);
                expect(tank.consumed).toBe(100);
            });

            it('Can`t set more consumed volume then available', () => {
                tank.consumedVolume = 3200;
                expect(tank.consumedVolume).toBeCloseTo(2893, 1);
                expect(tank.consumed).toBe(200);
            });
        });

        describe('Reserve', () => {
            it('Reserve can`t be negative', () => {
                tank.reserve = -100;
                expect(tank.reserve).toBe(0);
            });

            it('Reserve volume can`t be negative', () => {
                tank.reserveVolume = -100;
                expect(tank.reserveVolume).toBe(0);
            });

            it('Reserve volume can`t exceed available volume', () => {
                tank.reserveVolume = 4000;
                expect(tank.reserveVolume).toBeCloseTo(2893, 1);
            });

            it('Set reserve volume updates also pressure', () => {
                tank.reserveVolume = 450;
                expect(tank.reserve).toBe(30);
            });

            it('Set reserve pressure updates also volume', () => {
                tank.reserve = 20;
                expect(tank.reserveVolume).toBeCloseTo(301.7, 1);
            });

            it('Set reserve pressure does not round the set value', () => {
                const expected = 2;
                tank.reserve = expected;
                expect(tank.reserve).toBeCloseTo(expected, 6);
            });
        });
    });

    describe('Assign standard gas', () => {
        it('Assigns both O2 and He fractions', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('10/70');
            expect(modified.gas).toEqual(StandardGases.trimix1070);
        });

        it('Nothing changed if, gas wasn\'t found', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('unknown');
            expect(modified.gas).toEqual(StandardGases.air);
        });

        it('standard gas assignment', () => {
            const modified = new Tank(10, 200, 21);
            modified.assignStandardGas('Trimix 18/45');
            expect(modified.gas.contentCode).toBeCloseTo(18004500);
        });
    });

    describe('Load From', () => {
        it('Copy all properties', () => {
            // size is also copied
            const modified = new Tank(24, 100, 18);
            modified.gas.fHe = 0.35;
            modified.reserve = 60;
            modified.loadFrom(tank);
            expect(modified).toEqual(Tank.createDefault());
        });
    });

    describe('Create valid', () => {
        it('Size needs to at least 0.1 liter', () => {
            expect(() => new Tank(0, 100, 18)).toThrow();
        });

        it('Start pressure needs to be positive number', () => {
            expect(() => new Tank(10, -1, 18)).toThrow();
        });

        it('0 b Start pressure is valid', () => {
            expect(() => new Tank(10, 0, 18)).not.toThrow();
        });
    });

    describe('Real volumes', () => {
        const filledTank = new Tank(10, 200, 21);

        it('Real volume', () => {
            expect(filledTank.volume).toBeCloseTo(1928.651, 3);
        });

        it('Real reserve volume', () => {
            filledTank.reserve = 50;
            expect(filledTank.reserveVolume).toBeCloseTo(504.571, 3);
        });

        it('Real consumed volume', () => {
            filledTank.consumed = 100;
            expect(filledTank.consumedVolume).toBeCloseTo(1004.803, 3);
        });

        it('End pressure is complement of start pressure and consumed', () => {
            const sut = Tank.createDefault();
            sut.startPressure = 150;
            sut.consumed = 100;

            expect(sut.endPressure).toBeCloseTo(50, 3);
        });

        it('End volume is complement of start pressure and consumed', () => {
            const sut = Tank.createDefault();
            sut.startPressure = 150;
            sut.consumed = 100;

            expect(sut.volume).toBeCloseTo(2225.388, 3);
            expect(sut.consumedVolume).toBeCloseTo(1507.204, 3);
            expect(sut.endVolume).toBeCloseTo(718.184, 3);
        });
    });
});
