import { FormControl, ValidatorFn } from '@angular/forms';
import { ValidatorGroups } from './ValidatorGroups';
import { UnitConversion } from './UnitConversion';
import { Precision } from 'scuba-physics';

describe('ValidatorGroups', () => {
    const units = new UnitConversion();
    const sut = new ValidatorGroups(units);

    const isValid = (value: number, validators: ValidatorFn[]): boolean => new FormControl(value, validators).valid;

    describe('Dynamic ranges', () => {
        it('Diver RMV out of range is invalid', () => {
            expect(isValid(20, sut.diverRmv)).toBeTrue();
            expect(isValid(1, sut.diverRmv)).toBeFalse();
            expect(isValid(100, sut.diverRmv)).toBeFalse();
        });

        it('Max density out of range is invalid', () => {
            const range = units.ranges.maxDensity;
            expect(isValid(range[0], sut.maxDensity)).toBeTrue();
            expect(isValid(range[0] - 1, sut.maxDensity)).toBeFalse();
            expect(isValid(range[1] + 1, sut.maxDensity)).toBeFalse();
        });

        it('Tank pressure out of range is invalid', () => {
            const range = units.ranges.tankPressure;
            expect(isValid(range[1], sut.tankPressure)).toBeTrue();
            expect(isValid(range[0] - 1, sut.tankPressure)).toBeFalse();
            expect(isValid(range[1] + 1, sut.tankPressure)).toBeFalse();
        });
    });

    describe('Rebreather', () => {
        it('Injection ratio out of range is invalid', () => {
            expect(isValid(8, sut.injectionRatio)).toBeTrue();
            expect(isValid(3, sut.injectionRatio)).toBeFalse();
        });

        it('Metabolic O2 out of range is invalid', () => {
            expect(isValid(1, sut.metabolicO2)).toBeTrue();
            expect(isValid(4, sut.metabolicO2)).toBeFalse();
        });

        it('Metric metabolic O2 limits are valid in imperial units', () => {
            const imperial = new UnitConversion();
            imperial.imperialUnits = true;
            const imperialValidators = new ValidatorGroups(imperial);
            const rounding = imperial.ranges.rmvRounding;
            const minimum = Precision.round(imperial.fromLiter(0.5), rounding);
            const maximum = Precision.round(imperial.fromLiter(3), rounding);
            expect(isValid(minimum, imperialValidators.metabolicO2)).toBeTrue();
            expect(isValid(maximum, imperialValidators.metabolicO2)).toBeTrue();
        });
    });
});
