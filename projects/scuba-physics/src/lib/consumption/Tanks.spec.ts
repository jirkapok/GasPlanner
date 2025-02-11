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
            expect(tank.percentsRemaining).toBe(50);
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
            expect(tank.percentsReserve).toBe(50);
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
    });


    describe('Load From', () => {
        it('Copy all properties', () => {
            const modified = new Tank(24, 100, 18);
            modified.gas.fHe = 0.35;
            modified.reserve = 60;
            modified.loadFrom(tank);
            expect(tank).toEqual(Tank.createDefault());
        });
    });
});
