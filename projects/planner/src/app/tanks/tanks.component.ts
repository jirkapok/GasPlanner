import { Component, OnDestroy, OnInit } from '@angular/core';
import { faBatteryHalf, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { StandardGases, Tank } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { InputControls } from '../shared/inputcontrols';

export class TankBound {
    constructor(public tank: Tank, private units: UnitConversion) { }

    public get id(): number {
        return this.tank.id;
    }

    public get size(): number {
        return this.units.fromTankLiters(this.tank.size);
    }

    public get startPressure(): number {
        return this.units.fromBar(this.tank.startPressure);
    }

    public get o2(): number {
        return this.tank.o2;
    }

    public get he(): number {
        return this.tank.he;
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

    public set he(newValue: number) {
        this.tank.he = newValue;
    }
}

@Component({
    selector: 'app-tanks',
    templateUrl: './tanks.component.html',
    styleUrls: ['./tanks.component.css']
})
export class TanksComponent implements OnInit, OnDestroy {
    public allNames: string[];
    public icon = faBatteryHalf;
    public plusIcon = faPlusSquare;
    public trashIcon = faTrashAlt;
    public toxicity: GasToxicity;
    public tanksForm!: FormGroup;

    private bound: TankBound[] = [];
    private subscription!: Subscription;

    constructor(private planner: PlannerService,
        public units: UnitConversion,
        private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        private delayedCalc: DelayedScheduleService) {
        this.toxicity = new GasToxicity(this.planner.options);
        this.allNames = StandardGases.allNames();
        this.updateTanks();
    }

    public get firstTank(): TankBound {
        return this.bound[0];
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get tanks(): TankBound[] {
        return this.bound;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get firstTankSizeInvalid(): boolean {
        const firstTankSize = this.tanksForm.controls.firstTankSize;
        return InputControls.controlInValid(firstTankSize);
    }

    public get firstTankStartPressureInvalid(): boolean {
        const firstTankStartPressure = this.tanksForm.controls.firstTankStartPressure;
        return InputControls.controlInValid(firstTankStartPressure);
    }

    public ngOnInit(): void {
        this.tanksForm = this.fb.group({
            firstTankSize: [InputControls.formatNumber(this.numberPipe, this.firstTank.size),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            firstTankStartPressure: [InputControls.formatNumber(this.numberPipe, this.firstTank.startPressure),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
        });

        this.subscription = this.planner.tanksReloaded.subscribe(() => this.updateTanks());
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public isFirstTank(bound: TankBound): boolean {
        return this.firstTank !== bound;
    }

    public gasSac(bound: TankBound): number {
        const sac = this.planner.diver.gasSac(bound.tank);
        return this.units.fromBar(sac);
    }

    public addTank(): void {
        this.planner.addTank();
        this.updateTanks();
        this.apply();
    }

    public removeTank(bound: TankBound): void {
        this.planner.removeTank(bound.tank);
        this.updateTanks();
        this.apply();
    }

    public assignBestMix(): void {
        const maxDepth = this.planner.plan.maxDepth;
        this.firstTank.o2 = this.toxicity.bestNitroxMix(maxDepth);
        this.apply();
    }

    public assignStandardGas(bound: TankBound, gasName: string): void {
        bound.tank.assignStandardGas(gasName);
        this.apply();
    }

    public apply(): void {
        const values = this.tanksForm.value;

        this.firstTank.size = Number(values.firstTankSize);
        this.firstTank.startPressure = Number(values.firstTankStartPressure);
        this.delayedCalc.schedule();
    }

    private updateTanks(): void {
        const bound: TankBound[] = [];
        this.planner.tanks.forEach((t) => {
            const newBound = this.toBound(t);
            bound.push(newBound);
        });

        this.bound = bound;
    }

    private toBound(tank: Tank): TankBound {
        return new TankBound(tank, this.units);
    }
}
