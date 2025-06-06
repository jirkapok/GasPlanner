import { Component, Input, OnInit } from '@angular/core';
import { faBatteryHalf } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { NonNullableFormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Precision, TankTemplate, GasToxicity } from 'scuba-physics';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { Streamed } from '../../shared/streamed';
import { TankBound } from '../../shared/models';
import { RangeConstants, UnitConversion } from '../../shared/UnitConversion';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { TanksService } from '../../shared/tanks.service';

interface TankForm {
    firstTankSize: FormControl<number>;
    firstTankStartPressure: FormControl<number>;
    workPressure?: FormControl<number>;
    o2: FormControl<number>;
}

@Component({
    selector: 'app-tanks-simple',
    templateUrl: './tanks-simple.component.html',
    styleUrls: ['./tanks-simple.component.scss'],
    standalone: false
})
export class TanksSimpleComponent extends Streamed implements OnInit {
    @Input() public rootForm!: FormGroup;
    public icon = faBatteryHalf;
    public tanksForm!: FormGroup<TankForm>;
    constructor(
        public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private diveSchedules: DiveSchedules,
        private dispatcher: ReloadDispatcher) {
        super();
        this.rootForm = this.fb.group({});
    }

    public get toxicity(): GasToxicity {
        return this.diveSchedules.selectedToxicity;
    }

    public get firstTank(): TankBound {
        return this.diveSchedules.selectedTanks.firstTank;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get firstTankSizeInvalid(): boolean {
        const firstTankSize = this.tanksForm.controls.firstTankSize;
        return this.inputs.controlInValid(firstTankSize);
    }

    public get workPressureInvalid(): boolean {
        const workPressure = this.tanksForm.controls.workPressure;
        return this.inputs.controlInValid(workPressure);
    }

    public get firstTankStartPressureInvalid(): boolean {
        const firstTankStartPressure = this.tanksForm.controls.firstTankStartPressure;
        return this.inputs.controlInValid(firstTankStartPressure);
    }

    public ngOnInit(): void {
        this.tanksForm = this.fb.group({
            firstTankSize: [Precision.round(this.firstTank.size, 1), this.validators.tankSize],
            firstTankStartPressure: [Precision.round(this.firstTank.startPressure, 1), this.validators.tankPressure],
            o2: [Precision.round(this.firstTank.o2, 1), this.validators.nitroxOxygen]
        });

        if (this.units.imperialUnits) {
            const workPressureControl = this.fb.control(
                Precision.round(this.firstTank.workingPressure, 1), this.validators.tankPressure);
            this.tanksForm.addControl('workPressure', workPressureControl);
        }

        this.dispatcher.tanksReloaded$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((source: TanksService) => {
                if(this.diveSchedules.selectedTanks === source) {
                    this.reload();
                }
            });

        this.dispatcher.selectedChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.reload());

        this.rootForm.addControl('tanks', this.tanksForm);
    }

    public gasSac(): number {
        const tank = this.firstTank.tank;
        const sac = this.diveSchedules.selectedOptions.diverOptions.gasSac(tank);
        return this.units.fromBar(sac);
    }

    public assignBestMix(): void {
        if (this.rootForm.invalid) {
            return;
        }

        const maxDepth = this.diveSchedules.selectedDepths.plannedDepthMeters;
        this.firstTank.o2 = this.toxicity.bestNitroxMix(maxDepth);
        this.dispatcher.sendTankChanged();
    }

    public applyTemplate(template: TankTemplate): void {
        if (this.rootForm.invalid) {
            return;
        }

        this.tanksForm.patchValue({
            workPressure: template.workingPressure,
        });

        this.applySimple();
    }

    public applySimple(): void {
        if (this.rootForm.invalid) {
            return;
        }

        const values = this.tanksForm.value;
        this.firstTank.size = Number(values.firstTankSize);
        this.firstTank.workingPressure = Number(values.workPressure);
        this.firstTank.startPressure = Number(values.firstTankStartPressure);
        this.dispatcher.sendTankChanged();
    }

    private reload(): void {
        this.tanksForm.patchValue({
            firstTankSize: Precision.round(this.firstTank.size, 1),
            workPressure: Precision.round(this.firstTank.workingPressure, 1),
            firstTankStartPressure: Precision.round(this.firstTank.startPressure, 1),
            o2: Precision.round(this.firstTank.o2, 1)
        });
    }
}
