import { Component, OnDestroy, OnInit } from '@angular/core';
import { faBatteryHalf, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { PlannerService } from '../shared/planner.service';
import { StandardGases, Tank } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { Subscription } from 'rxjs';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { Level } from '../shared/models';

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
    styleUrls: ['./tanks.component.scss']
})
export class TanksComponent implements OnInit, OnDestroy {
    public allNames: string[];
    public icon = faBatteryHalf;
    public plusIcon = faPlus;
    public minusIcon = faMinus;
    public toxicity: GasToxicity;
    public tanksForm!: UntypedFormGroup;

    private bound: TankBound[] = [];
    private tanksSubscription!: Subscription;
    private viewSwitchSubscription!: Subscription;

    constructor(private planner: PlannerService,
        public units: UnitConversion,
        private fb: UntypedFormBuilder,
        private inputs: InputControls,
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

    public get tanksGroup(): UntypedFormArray {
        return this.tanksForm.controls.boundTanks as UntypedFormArray;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get firstTankSizeInvalid(): boolean {
        const firstTankSize = this.tanksForm.controls.firstTankSize;
        return this.inputs.controlInValid(firstTankSize);
    }

    public get firstTankStartPressureInvalid(): boolean {
        const firstTankStartPressure = this.tanksForm.controls.firstTankStartPressure;
        return this.inputs.controlInValid(firstTankStartPressure);
    }

    public ngOnInit(): void {
        this.tanksForm = this.fb.group({
            firstTankSize: [this.inputs.formatNumber(this.firstTank.size),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            firstTankStartPressure: [this.inputs.formatNumber(this.firstTank.startPressure),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
            boundTanks: this.fb.array(this.createTankControls())
        });

        this.tanksSubscription = this.planner.tanksReloaded.subscribe(() => this.reloadAll());
        this.viewSwitchSubscription = this.planner.viewSwitched.subscribe(() => this.reloadAll());
    }

    public ngOnDestroy(): void {
        this.tanksSubscription?.unsubscribe();
        this.viewSwitchSubscription?.unsubscribe();
    }

    public gasSac(index: number): number {
        const bound = this.tanks[index];
        const sac = this.planner.diver.gasSac(bound.tank);
        return this.units.fromBar(sac);
    }

    public gasHeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as UntypedFormGroup;
        return this.inputs.controlInValid(tank.controls.tankHe);
    }

    public gasO2Invalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as UntypedFormGroup;
        return this.inputs.controlInValid(tank.controls.tankO2);
    }

    public startPressureInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as UntypedFormGroup;
        return this.inputs.controlInValid(tank.controls.tankStartPressure);
    }

    public tankSizeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index) as UntypedFormGroup;
        return this.inputs.controlInValid(tank.controls.tankSize);
    }

    public addTank(): void {
        if (this.tanksForm.invalid) {
            return;
        }

        this.planner.addTank();
        this.updateTanks();
        const lastTank = this.tanks[this.tanks.length-1];
        const levelControls = this.createTankControl(lastTank);
        this.tanksGroup.push(levelControls);
        this.delayedCalc.schedule();
    }

    public removeTank(index: number): void {
        if (this.tanksForm.invalid || this.tanks.length <= 1) {
            return;
        }

        const bound = this.tanks[index];
        this.planner.removeTank(bound.tank);
        this.tanksGroup.removeAt(index);
        this.updateTanks();
        this.delayedCalc.schedule();
    }

    // TODO doesn't reload the oxygen input
    public assignBestMix(): void {
        const maxDepth = this.planner.plan.maxDepth;
        this.firstTank.o2 = this.toxicity.bestNitroxMix(maxDepth);
        this.reload(this.firstTank, 1);
        this.delayedCalc.schedule();
    }

    public assignStandardGas(index: number, gasName: string): void {
        const bound = this.tanks[index];
        bound.tank.assignStandardGas(gasName);
        this.reload(bound, index);
        this.delayedCalc.schedule();
    }

    public tankChanged(index: number): void {
        if(this.tanksForm.invalid) {
            return;
        }

        const tankControl = this.tanksGroup.at(index) as UntypedFormGroup;
        const bound = this.tanks[index];

        const values = tankControl.value;
        bound.size = Number(values.tankSize);
        bound.startPressure = Number(values.tankStartPressure);
        bound.o2 = Number(values.tankO2);
        bound.he = Number(values.tankHe);

        this.delayedCalc.schedule();
    }

    public applySimple(): void {
        if(this.tanksForm.invalid) {
            return;
        }

        const values = this.tanksForm.value;
        this.firstTank.size = Number(values.firstTankSize);
        this.firstTank.startPressure = Number(values.firstTankStartPressure);
        this.delayedCalc.schedule();
    }

    public tankLabel(tank: Tank): string {
        return Level.tankLabel(this.units, tank);
    }

    private reloadAll(): void {
        this.updateTanks();
        this.tanksForm.patchValue({
            firstTankSize: this.inputs.formatNumber(this.firstTank.size),
            firstTankStartPressure: this.inputs.formatNumber(this.firstTank.startPressure),
        });

        // recreate all controls, because wo don't know which were removed/added as part of reload.
        this.tanksGroup.clear();
        this.createTankControls().forEach(c => this.tanksGroup.push(c));
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

    private reload(bound: TankBound, index: number): void {
        const tankControl = this.tanksGroup.at(index);
        tankControl.patchValue({
            tankSize: bound.size,
            tankStartPressure: bound.startPressure,
            tankO2: bound.o2,
            tankHe: bound.he
        });
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
            tankSize: [this.inputs.formatNumber(tank.size),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            tankStartPressure: [this.inputs.formatNumber(tank.startPressure),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
            tankO2: [this.inputs.formatNumber(tank.o2),
                [Validators.required, Validators.min(this.ranges.trimixOxygen[0]), Validators.max(this.ranges.trimixOxygen[1])]],
            tankHe: [this.inputs.formatNumber(tank.he),
                [Validators.required, Validators.min(this.ranges.tankHe[0]), Validators.max(this.ranges.tankHe[1])]],
        });
    }
}
