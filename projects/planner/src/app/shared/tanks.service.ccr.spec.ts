import { TestBed } from '@angular/core/testing';
import { CircuitType, StandardGases, Tank } from 'scuba-physics';
import { TankBound } from './models';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';

describe('TanksService - closed circuit', () => {
    let service: TanksService;
    let dispatcher: ReloadDispatcher;

    const isOxygen = (bound: TankBound | undefined): boolean => !!bound && bound.tank.gas.compositionEquals(StandardGases.oxygen);

    const load = (...o2Percents: number[]): TankBound[] => {
        const tanks = o2Percents.map(o2 => new Tank(11, 200, o2));
        service.loadFrom(tanks);
        return service.tanks;
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UnitConversion, TanksService, ReloadDispatcher]
        });
        service = TestBed.inject(TanksService);
        dispatcher = TestBed.inject(ReloadDispatcher);
    });

    describe('Prepare for closed circuit', () => {
        it('keeps tanks when the second one is oxygen', () => {
            const original = load(21, 100, 50);
            service.prepareForClosedCircuit();
            expect(service.tanks).toEqual(original);
        });

        it('moves oxygen to the second position', () => {
            const [air, ean50, oxygen] = load(21, 50, 100);
            service.prepareForClosedCircuit();
            expect(service.tanks).toEqual([air, oxygen, ean50]);
            expect(service.tanks.map(t => t.id)).toEqual([1, 2, 3]);
        });

        it('keeps the same tank instance referenced by depth levels', () => {
            const oxygen = load(21, 50, 100)[2];
            const levelTank = oxygen.tank;
            service.prepareForClosedCircuit();
            expect(service.oxygenTank?.tank).toBe(levelTank);
        });

        it('first oxygen tank becomes the oxygen, the second one diluent', () => {
            const [oxygen, air] = load(100, 21);
            service.prepareForClosedCircuit();
            expect(service.tanks).toEqual([air, oxygen]);
            expect(service.diluentTank).toBe(air);
        });

        it('inserts new oxygen tank without overwriting existing tanks', () => {
            const [air, ean50] = load(21, 50);
            service.prepareForClosedCircuit();
            const tanks = service.tanks;
            expect(tanks.length).toBe(3);
            expect(tanks[0]).toBe(air);
            expect(isOxygen(tanks[1])).toBe(true);
            expect(tanks[1].tank.size).toBeCloseTo(3, 6);
            expect(tanks[1].tank.startPressure).toBeCloseTo(200, 6);
            expect(tanks[2]).toBe(ean50);
            expect(tanks.map(t => t.id)).toEqual([1, 2, 3]);
        });

        it('adds air diluent when the only tank is oxygen', () => {
            const [oxygen] = load(100);
            service.prepareForClosedCircuit();
            const tanks = service.tanks;
            expect(tanks.length).toBe(2);
            expect(tanks[0].tank.gas.compositionEquals(StandardGases.air)).toBe(true);
            expect(tanks[1]).toBe(oxygen);
        });

        it('notifies tanks reloaded once', () => {
            load(21);
            const reloaded = vi.spyOn(dispatcher, 'sendTanksReloaded');
            service.prepareForClosedCircuit();
            expect(reloaded).toHaveBeenCalledExactlyOnceWith(service);
        });
    });

    describe('Can remove', () => {
        it('protects diluent and oxygen in mCCR', () => {
            const tanks = load(21, 100, 50);
            expect(service.canRemove(tanks[0], CircuitType.mccr)).toBe(false);
            expect(service.canRemove(tanks[1], CircuitType.mccr)).toBe(false);
            expect(service.canRemove(tanks[2], CircuitType.mccr)).toBe(true);
        });

        it('protects diluent and oxygen in eCCR', () => {
            const tanks = load(21, 100, 50);
            expect(service.canRemove(tanks[0], CircuitType.eccr)).toBe(false);
            expect(service.canRemove(tanks[1], CircuitType.eccr)).toBe(false);
            expect(service.canRemove(tanks[2], CircuitType.eccr)).toBe(true);
        });

        it('allows removing second tank in other circuits', () => {
            const tanks = load(21, 100);
            expect(service.canRemove(tanks[1], CircuitType.oc)).toBe(true);
            expect(service.canRemove(tanks[1], CircuitType.pscr)).toBe(true);
        });
    });
});
