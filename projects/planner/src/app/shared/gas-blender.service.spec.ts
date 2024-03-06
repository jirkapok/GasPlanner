import { UnitConversion } from './UnitConversion';
import { GasBlenderService } from './gas-blender.service';

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

    describe('Imperial units', () => {
        beforeEach(() => {
            sut = createSut(true);
        });

        it('Mix result respects units', () => {
            sut.targetTank.o2 = 25;
            sut.targetTank.he = 25;
            sut.calculate();

            expect(sut.addO2).toBeCloseTo(42.65815815, 8);
            expect(sut.addHe).toBeCloseTo(725.18868865, 8);
            expect(sut.addTop).toBeCloseTo(2132.9079078, 8);
            expect(sut.removeFromSource).toBeCloseTo(0);
        });

        it('Remove respects units', () => {
            sut.sourceTank.startPressure = 2900;
            sut.targetTank.o2 = 25;
            sut.targetTank.he = 25;
            sut.calculate();

            expect(sut.needsRemove).toBeTruthy();
            expect(sut.removeFromSource).toBeCloseTo(1066.40028158, 8);
        });
    });
});
