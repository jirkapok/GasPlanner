import { Component, OnInit } from '@angular/core';
import { faBatteryHalf, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { PlannerService } from '../shared/planner.service';
import { StandardGases, Precision } from 'scuba-physics';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { takeUntil } from 'rxjs';
import { FormArray, NonNullableFormBuilder, FormGroup, FormControl } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Streamed } from '../shared/streamed';
import { TankBound } from '../shared/models';
import { TanksService } from '../shared/tanks.service';
import { OptionsService } from '../shared/options.service';

interface TankRow {
    tankSize: FormControl<number>;
    tankStartPressure: FormControl<number>;
    tankO2: FormControl<number>;
    tankHe: FormControl<number>;
    tankWorkPressure?: FormControl<number>;
}

interface TanksForm {
    boundTanks: FormArray<FormGroup<TankRow>>;
}

@Component({
    selector: 'app-tanks-complex',
    templateUrl: './tanks-complex.component.html',
    styleUrls: ['./tanks-complex.component.scss']
})
export class TanksComplexComponent extends Streamed implements OnInit {
    public allNames: string[];
    public icon = faBatteryHalf;
    public plusIcon = faPlus;
    public minusIcon = faMinus;
    public toxicity: GasToxicity;
    public tanksForm!: FormGroup<TanksForm>;

    constructor(private planner: PlannerService,
        private options: OptionsService,
        private tanksService: TanksService,
        public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private delayedCalc: DelayedScheduleService) {
        super();
        this.toxicity = this.options.toxicity;
        this.allNames = StandardGases.allNames();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get tanks(): TankBound[] {
        return this.tanksService.tanks;
    }

    public get tanksGroup(): FormArray<FormGroup<TankRow>> {
        return this.tanksForm.controls.boundTanks;
    }

    public get rowClasses(): string {
        // TODO finish complex tanks layout
        if (this.units.imperialUnits) {
            return '';
        }

        return '';
    }

    public ngOnInit(): void {
        const rows = this.fb.array(this.createTankControls());
        this.tanksForm = this.fb.group({
            boundTanks: rows
        });

        this.tanksService.tanksReloaded.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reloadAll());
    }

    public gasSac(index: number): number {
        const bound = this.tanks[index];
        const sac = this.options.diver.gasSac(bound.tank);
        return this.units.fromBar(sac);
    }

    public gasHeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index);
        return this.inputs.controlInValid(tank.controls.tankHe);
    }

    public gasO2Invalid(index: number): boolean {
        const tank = this.tanksGroup.at(index);
        return this.inputs.controlInValid(tank.controls.tankO2);
    }

    public workPressureInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index);
        return this.inputs.controlInValid(tank.controls.tankWorkPressure);
    }

    public startPressureInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index);
        return this.inputs.controlInValid(tank.controls.tankStartPressure);
    }

    public tankSizeInvalid(index: number): boolean {
        const tank = this.tanksGroup.at(index);
        return this.inputs.controlInValid(tank.controls.tankSize);
    }

    public addTank(): void {
        if (this.tanksForm.invalid) {
            return;
        }

        this.tanksService.addTank();
        const lastTank = this.tanks[this.tanks.length - 1];
        const levelControls = this.createTankControl(lastTank);
        this.tanksGroup.push(levelControls);
        this.delayedCalc.schedule();
    }

    public removeTank(index: number): void {
        if (this.tanksForm.invalid || this.tanks.length <= 1) {
            return;
        }

        const bound = this.tanks[index];
        this.tanksService.removeTank(bound);
        this.tanksGroup.removeAt(index);
        this.delayedCalc.schedule();
    }

    public assignStandardGas(index: number, gasName: string): void {
        const bound = this.tanks[index];
        bound.tank.assignStandardGas(gasName);
        this.reload(bound, index);
        this.delayedCalc.schedule();
    }

    public tankChanged(index: number): void {
        if (this.tanksForm.invalid) {
            return;
        }

        const tankControl = this.tanksGroup.at(index);
        const bound = this.tanks[index];

        const values = tankControl.value;
        bound.size = Number(values.tankSize);
        bound.workingPressure = Number(values.tankWorkPressure);
        bound.startPressure = Number(values.tankStartPressure);
        bound.o2 = Number(values.tankO2);
        bound.he = Number(values.tankHe);
        // to enforce reload he and O2 fields in case the affected each other
        this.reload(bound, index);

        this.delayedCalc.schedule();
    }

    private reloadAll(): void {
        // recreate all controls, because wo don't know which were removed/added as part of reload.
        this.tanksGroup.clear();
        this.createTankControls().forEach(c => this.tanksGroup.push(c));
    }

    private reload(bound: TankBound, index: number): void {
        const tankControl = this.tanksGroup.at(index);
        tankControl.patchValue({
            tankSize: bound.size,
            tankWorkPressure: bound.workingPressure,
            tankStartPressure: bound.startPressure,
            tankO2: bound.o2,
            tankHe: bound.he
        });
    }

    private createTankControls(): FormGroup<TankRow>[] {
        const created: FormGroup<TankRow>[] = [];
        for (const bound of this.tanks) {
            const newControl = this.createTankControl(bound);
            created.push(newControl);
        }

        return created;
    }

    private createTankControl(tank: TankBound): FormGroup<TankRow> {
        const rowControls: FormGroup<TankRow> = this.fb.group({
            tankSize: [Precision.round(tank.size, 1), this.validators.tankSize],
            tankStartPressure: [Precision.round(tank.startPressure, 1), this.validators.tankPressure],
            tankO2: [Precision.round(tank.o2, 1), this.validators.trimixOxygen],
            tankHe: [Precision.round(tank.he, 1), this.validators.trimixHe],
        });

        if (this.units.imperialUnits) {
            const wpControl = this.fb.control(Precision.round(tank.workingPressure, 1), this.validators.tankPressure);
            rowControls.addControl('tankWorkPressure', wpControl);
        }

        return rowControls;
    }
}