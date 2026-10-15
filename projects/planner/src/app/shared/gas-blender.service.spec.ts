import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';
import { BlenderMode } from './views.model';

describe('Gas blender service', () => {
    let sut: GasBlenderService;

    const createSut = (imperialUnits: boolean = false): GasBlenderService => {
        const units = new UnitConversion();
        units.imperialUnits = imperialUnits;
        return new GasBlenderService(units);
    };

    beforeEach(() => {
        sut = createSut();
    });

    it('Creates defaults', () => {
        expect(sut.addO2).toBeCloseTo(0);
        expect(sut.addHe).toBeCloseTo(0);
        expect(sut.addTop).toBeCloseTo(200, 0);
        expect(sut.removeFromSource).toBeCloseTo(0);
        expect(sut.needsRemove).toBeFalsy();
        expect(sut.unableToCalculate).toBeFalsy();
    });

    it('Handle unable to calculate error', () => {
        sut.topMix.o2 = 50;
        sut.calculate();

        expect(sut.addO2).toBeCloseTo(0);
        expect(sut.addHe).toBeCloseTo(0);
        expect(sut.addTop).toBeCloseTo(0);
        expect(sut.removeFromSource).toBeCloseTo(0);
        expect(sut.needsRemove).toBeFalsy();
        expect(sut.unableToCalculate).toBeTruthy();
    });

    describe('Identify mix', () => {
        beforeEach(() => {
            sut.mode = BlenderMode.identify;
            sut.sourceTank.o2 = 21;
            sut.sourceTank.he = 0;
            sut.sourceTank.startPressure = 50;
            sut.topMix.o2 = 32;
            sut.topMix.he = 0;
            sut.targetTank.startPressure = 200;
        });

        it('Default mode is blend', () => {
            const created = createSut();
            expect(created.mode).toEqual(BlenderMode.blend);
            expect(created.isIdentify).toBeFalsy();
        });

        it('Calculates resulting mix in percents', () => {
            sut.calculate();

            expect(sut.isIdentify).toBeTruthy();
            expect(sut.resultO2).toBeCloseTo(29.12, 2);
            expect(sut.resultHe).toBeCloseTo(0, 6);
            expect(sut.resultN2).toBeCloseTo(70.88, 2);
            expect(sut.unableToCalculate).toBeFalsy();
            expect(sut.finalPressureBelowSource).toBeFalsy();
        });

        it('Reports added pressure as top mix and nothing else', () => {
            sut.calculate();

            expect(sut.addTop).toBeCloseTo(150, 6);
            expect(sut.addO2).toBeCloseTo(0, 6);
            expect(sut.addHe).toBeCloseTo(0, 6);
            expect(sut.removeFromSource).toBeCloseTo(0, 6);
        });

        it('Final pressure below source pressure is unable to calculate', () => {
            sut.targetTank.startPressure = 40;
            sut.calculate();

            expect(sut.finalPressureBelowSource).toBeTruthy();
            expect(sut.unableToCalculate).toBeTruthy();
            expect(sut.resultO2).toBeCloseTo(0, 6);
            expect(sut.addTop).toBeCloseTo(0, 6);
        });

        it('Blend mode ignores final pressure below source', () => {
            sut.mode = BlenderMode.blend;
            sut.targetTank.startPressure = 40;
            sut.calculate();

            expect(sut.finalPressureBelowSource).toBeFalsy();
        });

        it('Added pressure respects units', () => {
            const imperial = createSut(true);
            imperial.mode = BlenderMode.identify;
            imperial.sourceTank.startPressure = 1000;
            imperial.targetTank.startPressure = 3000;
            imperial.calculate();

            expect(imperial.addTop).toBeCloseTo(2000, 3);
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            sut = createSut(true);
        });

        it('Mix result respects units', () => {
            sut.targetTank.o2 = 25;
            sut.targetTank.he = 25;
            sut.calculate();

            expect(sut.addO2).toBeCloseTo(40.70465848909668, 5);
            expect(sut.addHe).toBeCloseTo(712.5576795045736, 5);
            expect(sut.addTop).toBeCloseTo(2147.49241661073, 5);
            expect(sut.removeFromSource).toBeCloseTo(0);
        });

        it('Remove respects units', () => {
            sut.sourceTank.startPressure = 2900;
            sut.targetTank.o2 = 25;
            sut.targetTank.he = 25;
            sut.calculate();

            expect(sut.needsRemove).toBeTruthy();
            expect(sut.removeFromSource).toBeCloseTo(1138.5812052643712, 5);
        });
    });
});
