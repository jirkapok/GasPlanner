import { Component, OnDestroy, OnInit } from '@angular/core';
import { faBatteryHalf, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { StandardGases, Tank } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { Subscription } from 'rxjs';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    public get tanksGroup(): FormArray {
        return this.tanksForm.controls.boundTanks as FormArray;
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
            boundTanks: this.fb.array(this.createTankControls())
        });

        this.subscription = this.planner.tanksReloaded.subscribe(() => this.updateTanks());
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public gasSac(index: number): number {
        const bound = this.tanks[index];
        const sac = this.planner.diver.gasSac(bound.tank);
        return this.units.fromBar(sac);
    }

    public gasHeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as FormGroup;
        return InputControls.controlInValid(tank.controls.tankHe);
    }

    public gasO2Invalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as FormGroup;
        return InputControls.controlInValid(tank.controls.tankO2);
    }

    public startPressureInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as FormGroup;
        return InputControls.controlInValid(tank.controls.tankStartPressure);
    }

    public tankSizeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as FormGroup;
        return InputControls.controlInValid(tank.controls.tankSize);
    }

    public addTank(): void {
        this.planner.addTank();
        this.updateTanks();
        // TODO replace
        this.applySimple();
    }

    public removeTank(index: number): void {
        const bound = this.tanks[index];
        this.planner.removeTank(bound.tank);
        this.updateTanks();
        // TODO replace
        this.applySimple();
    }

    public assignBestMix(): void {
        const maxDepth = this.planner.plan.maxDepth;
        this.firstTank.o2 = this.toxicity.bestNitroxMix(maxDepth);
        // TODO instead of apply use reload
        this.applySimple();
    }

    public assignStandardGas(index: number, gasName: string): void {
        const bound = this.tanks[index];
        bound.tank.assignStandardGas(gasName);
        // TODO rebind item after gas assigned
        this.applySimple();
    }

    public tankChanged(index: number): void {
        // TODO switch to complex view need to rebind
        const tankControl = this.tanksGroup.at(index) as FormGroup;
        const bound = this.tanks[index];

        const values = tankControl.value;
        bound.size = Number(values.tankSize);
        bound.startPressure = Number(values.tankStartPressure);
        bound.o2 = Number(values.tankO2);
        bound.he = Number(values.tankHe);

        this.delayedCalc.schedule();
    }

    public applySimple(): void {
        const values = this.tanksForm.value;
        this.firstTank.size = Number(values.firstTankSize);
        this.firstTank.startPressure = Number(values.firstTankStartPressure);
        // TODO ensure rebind of the o2 field.
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

    private createTankControls(): AbstractControl[] {
        const created: AbstractControl[] = [];
        for(const bound of this.tanks) {
            const newControl = this.createTankControl(bound);
            created.push(newControl);
        }

        return created;
    }

    private createTankControl(tank: TankBound): AbstractControl {
        return this.fb.group({
            tankSize: [InputControls.formatNumber(this.numberPipe, tank.size),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            tankStartPressure: [InputControls.formatNumber(this.numberPipe, tank.startPressure),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
            tankO2: [InputControls.formatNumber(this.numberPipe, tank.o2),
                [Validators.required, Validators.min(this.ranges.trimixOxygen[0]), Validators.max(this.ranges.trimixOxygen[1])]],
            tankHe: [InputControls.formatNumber(this.numberPipe, tank.he),
                [Validators.required, Validators.min(this.ranges.tankHe[0]), Validators.max(this.ranges.tankHe[1])]],
        });
    }
}
