import { TestBed } from '@angular/core/testing';
import { ProfileComparatorService } from './profileComparatorService';
import { DiveSchedules } from '../dive.schedules';
import { UnitConversion } from '../UnitConversion';
import { ReloadDispatcher } from '../reloadDispatcher';
import { ConsumedGasDifference, GasesComparisonService } from './gases-comparison.service';
import { StandardGases } from 'scuba-physics';
import { TanksService } from '../tanks.service';

describe('GasesComparisonService', () => {
    let sut: GasesComparisonService;
    let profileDiff: ProfileComparatorService;
    let tanksA: TanksService;
    let tanksB: TanksService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                GasesComparisonService,
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]
        }).compileComponents();

        sut = TestBed.inject(GasesComparisonService);
        profileDiff = TestBed.inject(ProfileComparatorService);
        const schedule = TestBed.inject(DiveSchedules);
        schedule.add();
        profileDiff.selectProfile(1);
        tanksA = profileDiff.profileA.tanksService;
        tanksB = profileDiff.profileB.tanksService;
    });

    it('Compares default air tank', () => {
        expect(sut.gasesDifference).toEqual([ new ConsumedGasDifference(
            StandardGases.air,
            {
                total: 3000,
                consumed: 0,
                reserve: 0
            },
            {
                total: 3000,
                consumed: 0,
                reserve: 0
            }
        )]);
    });

    it('Profile A has one gas more', () => {
        tanksA.addTank();
        tanksA.tankData[1].assignStandardGas(StandardGases.ean32.name);

        expect(sut.gasesDifference).toEqual([
            new ConsumedGasDifference(StandardGases.air, {
                total: 3000,
                consumed: 0,
                reserve: 0
            }, {
                total: 3000,
                consumed: 0,
                reserve: 0
            }),
            new ConsumedGasDifference(StandardGases.ean32, {
                total: 2220,
                consumed: 0,
                reserve: 0
            }, {
                total: 0,
                consumed: 0,
                reserve: 0
            })
        ]);
    });

    it('Profile B has one gas more', () => {
        tanksB.addTank();
        tanksB.tankData[1].assignStandardGas(StandardGases.ean32.name);

        expect(sut.gasesDifference).toEqual([
            new ConsumedGasDifference(StandardGases.air, {
                total: 3000,
                consumed: 0,
                reserve: 0
            }, {
                total: 3000,
                consumed: 0,
                reserve: 0
            }),
            new ConsumedGasDifference(StandardGases.ean32, {
                total: 0,
                consumed: 0,
                reserve: 0
            }, {
                total: 2220,
                consumed: 0,
                reserve: 0
            })
        ]);
    });

    it('No common gas between profiles', () => {
        tanksB.tankData[0].assignStandardGas(StandardGases.ean32.name);

        expect(sut.gasesDifference).toEqual([
            new ConsumedGasDifference(StandardGases.air, {
                total: 3000,
                consumed: 0,
                reserve: 0
            }, {
                total: 0,
                consumed: 0,
                reserve: 0
            }),
            new ConsumedGasDifference(StandardGases.ean32, {
                total: 0,
                consumed: 0,
                reserve: 0
            }, {
                total: 3000,
                consumed: 0,
                reserve: 0
            })
        ]);
    });

    it('Compare values are in imperial units', () => {
        const units = TestBed.inject(UnitConversion);
        units.imperialUnits = true;
        tanksA.tankData[0].reserve = 50;
        tanksA.tankData[0].consumed = 100;
        const firstGas = sut.gasesDifference[0];

        expect(firstGas.profileA.total).toBeCloseTo(105.944, 6);
        expect(firstGas.profileA.consumed).toBeCloseTo(52.972, 6);
        expect(firstGas.profileA.reserve).toBeCloseTo(26.486, 6);
        expect(firstGas.profileB.total).toBeCloseTo(105.944, 6);
    });
});
