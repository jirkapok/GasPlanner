import { Injectable, signal } from '@angular/core';
import {
    CircuitType, DefaultValues, Precision, GasNames, RebreatherTanks, StandardGases, Tank, Tanks
} from 'scuba-physics';
import { TankBound } from './models';
import { ConsumedDto } from './serialization.model';
import { UnitConversion } from './UnitConversion';
import _ from 'lodash';
import { ReloadDispatcher } from './reloadDispatcher';

@Injectable()
export class TanksService {
    // tanks are added and removed by other components than the ones showing them
    private readonly _tanks = signal<TankBound[]>([]);

    constructor(private units: UnitConversion, private dispatcher: ReloadDispatcher) {
        const defaultTanks = this.units.defaults.tanks;
        this.addTankBy(defaultTanks.primary.size, defaultTanks.primary.workingPressure);
    }

    public get defaults(): DefaultValues {
        return this.units.defaults;
    }

    public get tanks(): TankBound[] {
        return this._tanks().slice();
    }

    /** only for recreational diver use case */
    public get firstTank(): TankBound {
        return this._tanks()[0];
    }

    /** Closed circuit rebreather diluent */
    public get diluentTank(): TankBound | undefined {
        return this._tanks()[0];
    }

    /** Closed circuit rebreather oxygen */
    public get oxygenTank(): TankBound | undefined {
        return this._tanks()[RebreatherTanks.oxygenIndex];
    }

    public get singleTank(): boolean {
        return this._tanks().length === 1;
    }

    public get enoughGas(): boolean {
        return Tanks.haveReserve(this.tankData);
    }

    public get tankData(): Tank[] {
        return _(this._tanks()).map(bt => bt.algorithmTank)
            .value();
    }

    public addTank(): void {
        const defaultTanks = this.units.defaults.tanks;
        this.addTankBy(defaultTanks.stage.size, defaultTanks.stage.workingPressure);
        this.dispatcher.sendTankChanged();
    }

    public removeTank(tank: TankBound): void {
        this._tanks.set(this._tanks().filter(g => g !== tank));
        this.renumberIds();
        this.dispatcher.sendTanksRemoved(tank.algorithmTank);
    }

    /** Closed circuit rebreathers need the diluent and oxygen tanks, they can't be removed */
    public canRemove(tank: TankBound, circuit: CircuitType): boolean {
        if (circuit !== CircuitType.mccr && circuit !== CircuitType.eccr) {
            return true;
        }

        return this._tanks().indexOf(tank) > RebreatherTanks.oxygenIndex;
    }

    /**
     * Ensures the second tank is oxygen without overwriting any existing tank.
     * Existing oxygen tank is moved to the second position, otherwise new oxygen tank is inserted.
     */
    public prepareForClosedCircuit(): void {
        const tanks = this._tanks().slice();
        const oxygenIndex = RebreatherTanks.oxygenIndex;

        if (!this.isOxygen(tanks[oxygenIndex])) {
            const foundIndex = tanks.findIndex(t => this.isOxygen(t));
            const oxygen = foundIndex >= 0 ? tanks.splice(foundIndex, 1)[0] : this.createOxygen();

            if (tanks.length === 0) {
                tanks.push(this.createDiluent());
            }

            tanks.splice(oxygenIndex, 0, oxygen);
        }

        this._tanks.set(tanks);
        this.renumberIds();
        this.dispatcher.sendTanksReloaded(this);
    }

    public loadFrom(tanks: Tank[]): void {
        if (tanks.length > 0) {
            const newTanks: TankBound[] = [];
            for (let index = 0; index < tanks.length; index++) {
                const tank = tanks[index];
                this.addTankFor(newTanks, tank);
            }

            this._tanks.set(newTanks);
        }

        this.dispatcher.sendTanksReloaded(this);
    }

    public copyTanksConsumption(tanks: ConsumedDto[]) {
        this._tanks().forEach(target => {
            const source = tanks.find(t => t.id === target.id);

            if (source) {
                target.assignConsumption(source.consumed, source.reserve);
            }
        });
    }

    /** even in case thirds rule, the last third is reserve, so we always divide by 2 */
    public calculateTurnPressure(): number {
        const consumed = this.firstTank.tank.consumed / 2;
        return this.firstTank.startPressure - Precision.floor(consumed);
    }

    public resetToSimple(): void {
        this._tanks.set(this._tanks().slice(0, 1));

        if (this.firstTank.he > 0) {
            this.firstTank.assignStandardGas(GasNames.airName);
        }
    }

    public firstBy(tank: Tank): TankBound | undefined {
        return _(this._tanks()).find(t => t.tank === tank);
    }

    private isOxygen(bound: TankBound | undefined): boolean {
        return !!bound && bound.tank.gas.compositionEquals(StandardGases.oxygen);
    }

    /** Small rebreather oxygen cylinder 3 L/200 bar */
    private createOxygen(): TankBound {
        const oxygen = new Tank(3, 200, 100);
        return new TankBound(oxygen, this.units);
    }

    private createDiluent(): TankBound {
        const defaultTanks = this.units.defaults.tanks;
        const bound = new TankBound(Tank.createDefault(), this.units);
        bound.workingPressure = defaultTanks.primary.workingPressure;
        bound.size = defaultTanks.primary.size;
        return bound;
    }

    /** both arguments in respective units */
    private addTankBy(size: number, workingPressure: number): void {
        const tank = Tank.createDefault();
        const tanks = this._tanks().slice();
        const bound = this.addTankFor(tanks, tank);
        bound.workingPressure = workingPressure;
        bound.size = size;
        this._tanks.set(tanks);
    }

    private addTankFor(target: TankBound[], source: Tank): TankBound {
        const bound = new TankBound(source, this.units);
        target.push(bound);
        bound.id = target.length;
        return bound;
    }

    private renumberIds(): void {
        for (let index = 0; index < this._tanks().length; index++) {
            const current = this._tanks()[index];
            current.id = index + 1;
        }
    }
}
