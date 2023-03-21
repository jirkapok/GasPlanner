import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver, ImperialUnits, Precision } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { TextConstants } from '../shared/TextConstants';
import { ValidatorGroups } from '../shared/ValidatorGroups';


@Component({
    selector: 'app-sac',
    templateUrl: './sac.component.html',
    styleUrls: ['./sac.component.scss']
})
export class SacComponent implements OnInit {
    public calcIcon = faCalculator;
    public formSac!: UntypedFormGroup;
    public depthConverterWarning = TextConstants.depthConverterWarning;
    private workingPressure = ImperialUnits.defaultWorkingPressure;
    private durationControl!: FormControl;
    private rmvControl!: FormControl;
    private usedControl!: FormControl;
    private workPressureControl!: FormControl;

    constructor(
        private validators: ValidatorGroups,
        private inputs: InputControls,
        private formBuilder: UntypedFormBuilder,
        private router: Router,
        private planer: PlannerService,
        private cd: ChangeDetectorRef,
        public calc: SacCalculatorService,
        public units: UnitConversion) {
    }

    public get gasSac(): number {
        const sac = Diver.gasSac(this.calc.rmv, this.calc.tank);
        return this.units.fromBar(sac);
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
        const rmv =  this.formSac.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public get durationInvalid(): boolean {
        const duration = this.formSac.controls.duration;
        return this.inputs.controlInValid(duration);
    }

    public get calcDepth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get calcTankSize(): number {
        return this.units.fromTankLiters(this.calc.tank, this.workingPressure);
    }

    public get calcWorkingPressure(): number {
        return this.units.fromBar(this.workingPressure);
    }

    public get calcUsed(): number {
        return this.units.fromBar(this.calc.used);
    }

    public get calcRmv(): number {
        return this.units.fromLiter(this.calc.rmv);
    }

    public get calcDuration(): number {
        return this.calc.duration;
    }

    private get dataModel(): any {
        return {
            depth: this.inputs.formatNumber(this.calcDepth),
            tankSize: this.inputs.formatNumber(this.calcTankSize),
            used: Precision.round(this.calcUsed, 1),
            workPressure: Precision.round(this.calcWorkingPressure, 1),
            duration: this.calcDuration,
            rmv: this.inputs.formatNumber(this.calcRmv, 2),
        };
    }

    public ngOnInit(): void {
        this.durationControl = this.formBuilder.control(this.inputs.formatNumber(this.calcDuration), this.validators.duration);
        this.usedControl = this.formBuilder.control(Precision.round(this.calcUsed, 1), this.validators.tankPressure);
        this.workPressureControl = this.formBuilder.control(Precision.round(this.calcWorkingPressure, 1),
            this.validators.tankPressure);
        this.rmvControl = this.formBuilder.control(this.inputs.formatNumber(this.calcRmv), this.validators.diverRmv);

        this.formSac = this.formBuilder.group({
            depth: [this.inputs.formatNumber(this.calcDepth), this.validators.depth],
            tankSize: [this.inputs.formatNumber(this.calcTankSize), this.validators.tankSize]
        });

        this.toSac();
    }

    public inputChanged(): void {
        if (this.formSac.invalid) {
            return;
        }

        const values = this.formSac.value;
        this.workingPressure = this.units.toBar(Number(values.workPressure));
        this.calc.tank = this.units.toTankLiters(Number(values.tankSize), this.workingPressure);
        this.calc.depth = this.units.toMeters(Number(values.depth));
        this.calc.used = this.units.toBar(Number(values.used));
        this.calc.rmv = this.units.toLiter(Number(values.rmv));
        this.calc.duration = Number(values.duration);

        this.reload();
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

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        if (this.formSac.invalid) {
            return;
        }

        this.planer.diver.rmv = this.calc.rmv;
    }

    private enableAll(): void {
        this.formSac.addControl('used', this.usedControl);
        this.formSac.addControl('duration', this.durationControl);
        this.formSac.addControl('rmv', this.rmvControl);
        this.formSac.addControl('workPressure', this.workPressureControl);
        this.reload();
    }

    private reload(): void {
        this.formSac.patchValue(this.dataModel);
    }
}
