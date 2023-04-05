import { TestBed } from '@angular/core/testing';
import { Diver, Options } from 'scuba-physics';
import { OptionsService } from './options.service';
import { UnitConversion } from './UnitConversion';

describe('Options Service', () => {
    let service: OptionsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OptionsService, UnitConversion]
        });
        service = TestBed.inject(OptionsService);
    });

    describe('Metric', () => {
        beforeEach(() => {
            service.ascentSpeed6m = 11;
            service.gasSwitchDuration = 5;
        });

        describe('Use recreational', () => {
            beforeEach(() => {
                service.useRecreational();
            });

            it('Applies recre values', () => {
                expect(service.ascentSpeed6m).toBe(9);
            });

            it('Applies common recre values', () => {
                expect(service.gasSwitchDuration).toBe(2);
            });
        });

        describe('Use recommended', () => {
            beforeEach(() => {
                service.useRecommended();
            });

            it('Applies recommended values', () => {
                expect(service.ascentSpeed6m).toBe(3);
            });

            it('Applies common recommended values', () => {
                expect(service.gasSwitchDuration).toBe(2);
            });
        });
    });

    describe('Imperial', () => {
        beforeEach(() => {
            service.ascentSpeed6m = 11;
            service.gasSwitchDuration = 5;
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
        });

        describe('Use recreational defaults', () => {
            beforeEach(() => {
                service.useRecreational();
            });

            it('Applies recre imperial values', () => {
                expect(service.ascentSpeed6m).toBeCloseTo(30, 3);
            });

            it('Applies common recre imperial values', () => {
                expect(service.gasSwitchDuration).toBe(2);
            });
        });

        describe('Use recommended defaults', () => {
            beforeEach(() => {
                service.useRecommended();
            });

            it('Applies recommended imperial values', () => {
                expect(service.ascentSpeed6m).toBeCloseTo(10, 3);
            });

            it('Applies common recommended imperial values', () => {
                expect(service.gasSwitchDuration).toBe(2);
            });
        });

        describe('Converts values', () => {
            let options: Options;

            beforeEach(() => {
                options = service.getOptions();
            });

            it('Altitude bound to imperial', () => {
                options.maxEND = 30;
                expect(service.maxEND).toBeCloseTo(98.425197, 6);
            });

            it('Last stop depth bound to imperial', () => {
                service.lastStopDepth = 10;
                expect(options.lastStopDepth).toBeCloseTo(3.048, 6);
            });

            it('Descent speed bound to imperial', () => {
                service.descentSpeed = 10;
                expect(options.descentSpeed).toBeCloseTo(3.048, 6);
            });

            it('Ascent speed to 50% bound to imperial', () => {
                service.ascentSpeed50perc = 10;
                expect(options.ascentSpeed50perc).toBeCloseTo(3.048, 6);
            });

            it('Ascent speed 50% to 6 m bound to imperial', () => {
                service.ascentSpeed50percTo6m = 10;
                expect(options.ascentSpeed50percTo6m).toBeCloseTo(3.048, 6);
            });

            it('Ascent speed from 6 m bound to imperial', () => {
                service.ascentSpeed6m = 10;
                expect(options.ascentSpeed6m).toBeCloseTo(3.048, 6);
            });
        });
    });

    it('Apply diver updates ppO2 limits', () => {
        const diver = new Diver();
        diver.maxPpO2 = 1.22;
        diver.maxDecoPpO2 = 1.45;
        service.applyDiver(diver);
        expect(service.maxPpO2).toBe(1.22);
        expect(service.maxDecoPpO2).toBe(1.45);
    });
});
