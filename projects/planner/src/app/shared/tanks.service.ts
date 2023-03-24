import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DefaultValues, Precision, Tank, Tanks } from 'scuba-physics';
import { TankBound } from './models';
import { TankDto } from './serialization.model';
import { UnitConversion } from './UnitConversion';
import _ from 'lodash';

@Injectable()
export class TanksService {
    /** Event fired only in case of tanks rebuild (loadFrom or resetToSimple).
     *  Not fired when adding or removing tanks.
     **/
    public tanksReloaded: Observable<void>;

    public tankRemoved: Observable<Tank>;

    private _tanks: TankBound[] = [];
    private onTanksReloaded = new Subject<void>();
    private onTankRemoved = new Subject<Tank>();

    constructor(private units: UnitConversion) {
        this.addTankBy(this.defaults.primaryTankSize, this.defaults.primaryTankWorkPressure);
        this.tanksReloaded = this.onTanksReloaded.asObservable();
        this.tankRemoved = this.onTankRemoved.asObservable();
    }

    public get defaults(): DefaultValues {
        return this.units.defaults;
    }

    public get tanks(): TankBound[] {
        return this._tanks.slice();
    }

    /** only for recreational diver use case */
    public get firstTank(): TankBound {
        return this._tanks[0];
    }

    public get singleTank(): boolean {
        return this._tanks.length === 1;
    }

    public get enoughGas(): boolean {
        return Tanks.haveReserve(this.tankData);
    }

    public get tankData(): Tank[] {
        return _(this._tanks).map(bt => bt.tank)
            .value();
    }

    public addTank(): void {
        this.addTankBy(this.defaults.stageTankSize, this.defaults.stageTankWorkPressure);
    }

    public removeTank(tank: TankBound): void {
        this._tanks = this._tanks.filter(g => g !== tank);
        this.renumberIds();
        this.onTankRemoved.next(tank.tank);
    }

    public loadFrom(tanks: Tank[]): void {
        if (tanks.length > 0) {
            const newTanks: TankBound[] = [];
            for (let index = 0; index < tanks.length; index++) {
                const tank = tanks[index];
                this.addTankFor(newTanks, tank);
            }

            this._tanks = newTanks;
        }

        this.onTanksReloaded.next();
    }

    public copyTanksConsumption(tanks: TankDto[]) {
        for (let index = 0; index < this.tanks.length; index++) {
            const source = tanks[index];
            const target = this.tanks[index];
            target.tank.consumed = source.consumed;
            target.tank.reserve = source.reserve;
        }
    }

    /** even in case thirds rule, the last third is reserve, so we always divide by 2 */
    public calculateTurnPressure(): number {
        const consumed = this.firstTank.tank.consumed / 2;
        return this.firstTank.startPressure - Precision.floor(consumed);
    }

    public resetToSimple(): void {
        this._tanks = this._tanks.slice(0, 1);

        if (this.firstTank.he > 0) {
            this.firstTank.tank.assignStandardGas('Air');
        }

        this.onTanksReloaded.next();
    }

    public firstBy(tank: Tank): TankBound | undefined {
        return _(this._tanks).find(t => t.tank === tank);
    }

    /** both arguments in respective units */
    private addTankBy(size: number, workingPressure: number): void {
        const tank = Tank.createDefault();
        const bound = this.addTankFor(this._tanks, tank);
        bound.workingPressure = workingPressure;
        bound.size = size;
    }

    private addTankFor(target: TankBound[], source: Tank): TankBound {
        const bound = new TankBound(source, this.units);
        target.push(bound);
        bound.id = target.length;
        return bound;
    }

    private renumberIds(): void {
        for (let index = 0; index < this._tanks.length; index++) {
            const current = this._tanks[index];
            current.id = index + 1;
        }
    }
}
