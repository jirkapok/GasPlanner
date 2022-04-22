import { Component } from '@angular/core';
import { faBatteryHalf, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { StandardGases, Tank, Diver } from 'scuba-physics';

@Component({
    selector: 'app-tanks',
    templateUrl: './tanks.component.html',
    styleUrls: ['./tanks.component.css']
})
export class TanksComponent {
    public firstTank: Tank;
    public allNames: string[];
    public nitroxNames: string[];
    public icon = faBatteryHalf;
    public plusIcon = faPlusSquare;
    public trashIcon = faTrashAlt;
    private diver: Diver;

    constructor(public planner: PlannerService) {
        this.firstTank = this.planner.firstTank;
        this.diver = this.planner.diver;
        this.allNames = StandardGases.allNames();
        this.nitroxNames = StandardGases.nitroxNames();
        // TODO adding two gases oxygen and 12/60 causes the calculation to fail
    }

    public get tanks(): Tank[] {
        return this.planner.tanks;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get o2(): number {
        return this.firstTank.o2;
    }

    public set o2(newValue: number) {
        this.firstTank.o2 = newValue;
    }

    public gasSac(gas: Tank): number {
        return this.diver.gasSac(gas);
    }

    public addTank(): void {
        this.planner.addTank();
    }

    public removeTank(gas: Tank): void {
        this.planner.removeTank(gas);
    }

    public assignBestMix(): void {
        this.o2 = this.planner.bestNitroxMix();
    }

    public gasChanged(): void {
        this.planner.calculate();
    }

    public assignStandardGas(gas: Tank, gasName: string): void {
        gas.assignStandardGas(gasName);
        this.gasChanged();
    }
}
