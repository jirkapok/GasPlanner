import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Tank } from 'scuba-physics';
import { TankBound } from './models';
import { UnitConversion } from './UnitConversion';

@Injectable()
export class TanksService {
    /** Event fired only in case of tanks rebuild (loadFrom or resetToSimple).
     *  Not fired when adding or removing tanks.
     **/
    public tanksReloaded: Observable<void>;

    private _tanks: TankBound[] = [];
    private onTanksReloaded = new Subject<void>();

    constructor(private units: UnitConversion) {
        // TODO default tank in imperials: 100 cubic feet / 3442 PSI
        this.addTankBy(15);
        this.tanksReloaded = this.onTanksReloaded.asObservable();
    }

    public get tanks(): TankBound[] {
        return this._tanks.slice();
    }

    /** only for recreational diver use case */
    public get firstTank(): TankBound {
        return this._tanks[0];
    }

    public addTank(): void {
        // TODO default imperial size for stage?
        this.addTankBy(11); // S80 by default
    }

    public removeTank(tank: TankBound): void {
        this._tanks = this._tanks.filter(g => g !== tank);
        this.renumberIds();
        // TODO this.plan.resetSegments(tank, this.firstTank);
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

    public resetToSimple(): void {
        this._tanks = this._tanks.slice(0, 1);

        if (this.firstTank.he > 0) {
            this.firstTank.tank.assignStandardGas('Air');
        }

        this.onTanksReloaded.next();
    }

    private addTankBy(size: number): void {
        const tank = Tank.createDefault();
        const bound = this.addTankFor(this._tanks, tank);
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
