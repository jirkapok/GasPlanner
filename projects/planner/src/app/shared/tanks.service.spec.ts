import { TestBed } from '@angular/core/testing';
import { Tank } from 'scuba-physics';
import { TankBound } from './models';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';

describe('TanksService', () => {
    let service: TanksService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                UnitConversion, TanksService, ReloadDispatcher
            ]
        });
        service = TestBed.inject(TanksService);
    });

    it('Has one default tank', () => {
        const tanksCount = service.tanks.length;
        expect(tanksCount).toEqual(1);
    });

    it('Provides first tank', () => {
        const tanksCount = service.tanks[0];
        expect(tanksCount).toEqual(service.firstTank);
    });

    it('Added tank receives ID', () => {
        service.addTank();
        const count = service.tanks.length;
        const added = service.tanks[count - 1];

        expect(added.id).toEqual(2);
    });

    describe('Remove', () => {
        beforeEach(() => {
            service.addTank();
            service.addTank();
            const secondTank = service.tanks[1];
            service.removeTank(secondTank);
        });

        it('Tank is removed', () => {
            expect(service.tanks.length).toEqual(2);
        });

        it('Tank ids are updated', () => {
            const secondTank = service.tanks[1];
            expect(secondTank.id).toEqual(2);
        });
    });

    describe('Load from', () => {
        it('Doesn\'t update by empty array', () => {
            service.loadFrom([]);
            expect(service.tanks.length).toEqual(1);
        });

        describe('multiple tanks', () => {
            let tanksReloaded = false;

            beforeEach(() => {
                const dispatcher = TestBed.inject(ReloadDispatcher);
                dispatcher.tanksReloaded$.subscribe(() => tanksReloaded = true);

                const newTanks = [
                    Tank.createDefault(),
                    Tank.createDefault(),
                ];
                service.loadFrom(newTanks);
            });

            it('Loads new Tanks', () => {
                expect(service.tanks.length).toEqual(2);
            });

            it('Renumbers tanks', () => {
                const secondTank = service.tanks[1];
                expect(secondTank.id).toEqual(2);
            });

            it('Fires reloaded', () => {
                expect(tanksReloaded).toBeTruthy();
            });
        });
    });

    describe('Switch to simple', () => {
        let firstTank: TankBound;

        beforeEach(() => {
            service.addTank();
            service.addTank();
            firstTank = service.firstTank;
            firstTank.he = 45;
            firstTank.o2 = 18;
            service.resetToSimple();
        });

        it('Resets gases to one only', () => {
            expect(service.tanks.length).toBe(1);
        });

        it('Keeps first gas content', () => {
            const expectedO2 = 50;
            firstTank.o2 = expectedO2;
            firstTank.he = 0;
            service.resetToSimple();
            expect(firstTank.o2).toBe(expectedO2);
        });

        it('Resets gas content to editable gas', () => {
            expect(firstTank.o2).toBe(21);
            expect(firstTank.he).toBe(0);
        });
    });

    describe('Defaults', () => {
        describe('Metric', () => {
            it('Default tanks is 15 L', () => {
                const tankSize = service.firstTank.size;
                expect(tankSize).toBe(15);
            });

            it('Default second tank is S80 11 L', () => {
                service.addTank();
                const tankSize = service.tanks[1].size;
                expect(tankSize).toBe(11.1);
            });

            // working pressure is relevant only when switching units for existing tanks
            it('Default working pressure for 15 L', () => {
                const workingPressure = service.firstTank.workingPressure;
                expect(workingPressure).toBeCloseTo(0, 3);
            });

            it('Default second tank working pressure for S80 11 L', () => {
                service.addTank();
                const workingPressure = service.tanks[1].workingPressure;
                expect(workingPressure).toBeCloseTo(0, 3);
            });
        });

        describe('Imperial', () => {
            beforeEach(() => {
                const units = TestBed.inject(UnitConversion);
                units.imperialUnits = true;
                service = new TanksService(units, new ReloadDispatcher());
            });

            it('Default tanks is 117 cuft', () => {
                const tankSize = service.firstTank.size;
                expect(tankSize).toBe(124.1);
            });

            it('Default second tank is S80 80 cuft', () => {
                service.addTank();
                const tankSize = service.tanks[1].size;
                expect(tankSize).toBe(80.1);
            });

            it('Default working pressure for 177 cuft', () => {
                const workingPressure = service.firstTank.workingPressure;
                expect(workingPressure).toBeCloseTo(3442);
            });

            it('Default second tank working pressure for S80 80 cuft', () => {
                service.addTank();
                const workingPressure = service.tanks[1].workingPressure;
                expect(workingPressure).toBeCloseTo(3000);
            });
        });
    });
});
