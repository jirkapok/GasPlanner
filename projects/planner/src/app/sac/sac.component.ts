import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { faLungs } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver, Precision, Tank, TankTemplate } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { TextConstants } from '../shared/TextConstants';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { OptionsService } from '../shared/options.service';
import { TankBound } from '../shared/models';
import { SacViewState } from '../shared/views.model';
import { KnownViews } from '../shared/viewStates';
import { SubViewStorage } from '../shared/subViewStorage';

interface SacForm {
    depth: FormControl<number>;
    tankSize: FormControl<number>;
    used?: FormControl<number>;
    duration?: FormControl<number>;
    rmv?: FormControl<number>;
    workPressure?: FormControl<number>;
}

@Component({
    selector: 'app-sac',
    templateUrl: './sac.component.html',
    styleUrls: ['./sac.component.scss']
})
export class SacComponent implements OnInit {
    public calcIcon = faLungs;
    public formSac!: FormGroup<SacForm>;
    public depthConverterWarning = TextConstants.depthConverterWarning;
    // used as store for working pressure, keep in mind to sync size
    public tank: TankBound;
    private durationControl!: FormControl<number>;
    private rmvControl!: FormControl<number>;
    private usedControl!: FormControl<number>;

    constructor(
        private validators: ValidatorGroups,
        private inputs: InputControls,
        private formBuilder: NonNullableFormBuilder,
        private options: OptionsService,
        private cd: ChangeDetectorRef,
        public calc: SacCalculatorService,
        public units: UnitConversion,
        public location: Location,
        private viewStates: SubViewStorage) {
        this.tank = new TankBound(Tank.createDefault(), this.units);
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get depthInvalid(): boolean {
        const depth = this.formSac.controls.depth;
        return this.inputs.controlInValid(depth);
    }

    public get tankInvalid(): boolean {
        const tankSize = this.formSac.controls.tankSize;
        return this.inputs.controlInValid(tankSize);
    }

    public get workPressureInvalid(): boolean {
        const workPressure = this.formSac.controls.workPressure;
        return this.inputs.controlInValid(workPressure);
    }

    public get usedInvalid(): boolean {
        const used = this.formSac.controls.used;
        return this.inputs.controlInValid(used);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.formSac.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public get durationInvalid(): boolean {
        const duration = this.formSac.controls.duration;
        return this.inputs.controlInValid(duration);
    }

    public get calcDepth(): number {
        const depth = this.units.fromMeters(this.calc.depth);
        return Precision.round(depth, 1);
    }

    public get calcTankSize(): number {
        const tankSize = this.tank.size;
        return Precision.round(tankSize, 1);
    }

    public get calcWorkingPressure(): number {
        const workPressure = this.tank.workingPressure;
        return Precision.round(workPressure, 1);
    }

    public get calcUsed(): number {
        const used = this.units.fromBar(this.calc.used);
        return Precision.round(used, 1);
    }

    public get calcRmv(): number {
        const rmv = this.units.fromLiter(this.calc.rmv);
        const roundTo = this.units.ranges.rmvRounding;
        return Precision.round(rmv, roundTo);
    }

    public get calcDuration(): number {
        const duration = this.calc.duration;
        return Precision.round(duration);
    }

    public get gasSac(): number {
        const sac = Diver.gasSac(this.calc.rmv, this.calc.tankSize);
        return this.units.fromBar(sac);
    }

    public ngOnInit(): void {
        this.setDefaultValues();
        this.loadState();
        this.saveState();

        this.durationControl = this.formBuilder.control(this.calcDuration, this.validators.duration);
        this.usedControl = this.formBuilder.control(this.calcUsed, this.validators.tankConsumed);
        this.rmvControl = this.formBuilder.control(this.calcRmv, this.validators.diverRmv);

        this.formSac = this.formBuilder.group({
            depth: [this.calcDepth, this.validators.depth],
            tankSize: [this.calcTankSize, this.validators.tankSize]
        });

        if (this.units.imperialUnits) {
            const workPressureControl = this.formBuilder.control(this.calcWorkingPressure, this.validators.tankPressure);
            this.formSac.addControl('workPressure', workPressureControl);
        }

        this.toSac();
    }

    public applyTemplate(template: TankTemplate): void {
        if (this.formSac.invalid) {
            return;
        }

        this.formSac.patchValue({
            workPressure: template.workingPressure,
        });

        this.inputChanged();
    }

    public inputChanged(): void {
        if (this.formSac.invalid) {
            return;
        }

        const values = this.formSac.value;
        this.tank.workingPressure = Number(values.workPressure);
        this.tank.size = Number(values.tankSize);
        this.calc.tankSize = this.tank.tank.size;
        this.calc.depth = this.units.toMeters(Number(values.depth));
        this.calc.used = this.units.toBar(Number(values.used));
        this.calc.rmv = this.units.toLiter(Number(values.rmv));
        this.calc.duration = Number(values.duration);

        this.reload();
        this.saveState();
    }

    public toDuration(): void {
        this.calc.toDuration();
        this.enableAll();
        this.formSac.removeControl('duration');
        this.cd.detectChanges();
    }

    public toUsed(): void {
        this.calc.toUsed();
        this.enableAll();
        this.formSac.removeControl('used');
        this.cd.detectChanges();
    }

    public toSac(): void {
        this.calc.toSac();
        this.enableAll();
        this.formSac.removeControl('rmv');
        this.cd.detectChanges();
    }

    public use(): void {
        if (this.formSac.invalid) {
            return;
        }

        this.options.diverOptions.rmv = this.calc.rmv;
    }

    private enableAll(): void {
        this.formSac.addControl('used', this.usedControl);
        this.formSac.addControl('duration', this.durationControl);
        this.formSac.addControl('rmv', this.rmvControl);
        this.reload();
    }

    private reload(): void {
        this.formSac.patchValue({
            depth: this.calcDepth,
            tankSize: this.calcTankSize,
            workPressure: this.calcWorkingPressure,
            used: this.calcUsed,
            duration: this.calcDuration,
            rmv: this.calcRmv,
        });
    }

    private setDefaultValues(): void {
        // convert all default values to metric units
        // working pressure is irrelevant here, since not changed when switching units
        // depth adjusted to cca 15 meters
        const stopDistance = this.units.defaults.stopsDistance;
        this.calc.depth = this.units.toMeters(stopDistance * 5);
        const defaultTanks = this.units.defaults.tanks;
        this.tank.workingPressure = defaultTanks.primary.workingPressure;
        this.tank.size = defaultTanks.primary.size;
        this.calc.tankSize = this.tank.tank.size;

        // rmv is calculated and duration is units independent
        if (this.units.imperialUnits) {
            this.calc.used = this.units.toBar(2200);
        } else {
            this.calc.used = 150;
        }
    }

    private loadState(): void {
        let state: SacViewState = this.viewStates.loadView(KnownViews.sac);

        if (!state) {
            state = this.createState();
        }

        this.calc.depth = state.avgDepth;
        this.tank.workingPressureBars = state.workPressure;
        this.calc.tankSize = state.tankSize;
        this.tank.tank.size = this.calc.tankSize;
        this.calc.used = state.used;
        this.calc.duration = state.duration;
    }

    private saveState(): void {
        const viewState = this.createState();
        this.viewStates.saveView(viewState);
    }

    private createState(): SacViewState {
        // since we need to respect units we use current state as default
        return {
            avgDepth: this.calc.depth,
            tankSize: this.calc.tankSize,
            workPressure: this.tank.workingPressureBars,
            used: this.calc.used,
            duration: this.calc.duration,
            id: KnownViews.sac
        };
    }
}
