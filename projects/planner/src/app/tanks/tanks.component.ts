import { Component } from '@angular/core';
import { faBatteryHalf, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { StandardGases, Tank, Diver } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';

export class TankBound {
    constructor(public tank: Tank, private units: UnitConversion) {}

    public get size(): number {
        return this.units.fromTankLiters(this.tank.size);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get o2(): number {
        return this.tank.o2;
    }

    public set size(newValue: number) {
        this.tank.size = this.units.toTankLiters(newValue);
    }

    public set startPressure(newValue: number) {
        this.tank.startPressure = this.units.toBar(newValue);
    }

    public set o2(newValue: number) {
        this.tank.o2 = newValue;
    }
}

@Component({
    selector: 'app-tanks',
    templateUrl: './tanks.component.html',
    styleUrls: ['./tanks.component.css']
})
export class TanksComponent {
    public allNames: string[];
    public icon = faBatteryHalf;
    public plusIcon = faPlusSquare;
    public trashIcon = faTrashAlt;
    private diver: Diver;

    constructor(private planner: PlannerService,
        public units: UnitConversion,
        private delayedCalc: DelayedScheduleService) {
        this.diver = this.planner.diver;
        this.allNames = StandardGases.allNames();
    }

    // TODO Bound tank for all tanks
    public get firstTank(): TankBound {
        return new TankBound(this.planner.firstTank, this.units);
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get tanks(): Tank[] {
        return this.planner.tanks;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public isFirstTank(tank: Tank): boolean {
        return this.planner.firstTank !== tank;
    }

    public gasSac(tank: Tank): number {
        const sac = this.diver.gasSac(tank);
        return this.units.fromBar(sac);
    }

    public addTank(): void {
        this.planner.addTank();
        this.apply();
    }

    public removeTank(tank: Tank): void {
        this.planner.removeTank(tank);
        this.apply();
    }

    public assignBestMix(): void {
        this.firstTank.o2 = this.planner.bestNitroxMix();
        this.apply();
    }

    public assignStandardGas(gas: Tank, gasName: string): void {
        gas.assignStandardGas(gasName);
        this.apply();
    }

    public apply(): void {
        this.delayedCalc.schedule();
    }
}
