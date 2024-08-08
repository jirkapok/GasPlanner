import { TestBed } from '@angular/core/testing';
import { ApplicationSettingsService } from './ApplicationSettings';
import { UnitConversion } from './UnitConversion';

describe('ApplicationSettingsService', () => {
    let sut: ApplicationSettingsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                ApplicationSettingsService, UnitConversion
            ]
        }).compileComponents();

        sut = TestBed.inject(ApplicationSettingsService);
    });

    it('Applies gas density', () => {
        sut.maxGasDensity = 5.3;
        expect(sut.maxGasDensity).toBeCloseTo(5.3, 3);
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
        });

        it('Applies gas density in lbs/cuft', () => {
            expect(sut.maxGasDensity).toBeCloseTo(0.35583938, 8);
        });
    });
});
