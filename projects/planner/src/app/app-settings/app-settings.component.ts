import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, Validators, FormControl
} from '@angular/forms';
import { Location } from '@angular/common';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { faBatteryHalf, faUserCog } from '@fortawesome/free-solid-svg-icons';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { SubViewStorage } from '../shared/subViewStorage';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { InputControls } from '../shared/inputcontrols';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { Precision } from 'scuba-physics';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
    public flagIcon = faFlag;
    public diverIcon = faUserCog;

    public settingsForm!: FormGroup<{
        imperialUnits: FormControl<boolean>;
        maxDensity: FormControl<number>;
        primaryTankReserve: FormControl<number>;
        stageTankReserve: FormControl<number>;
        icdIgnored: FormControl<boolean>;
        densityIgnored: FormControl<boolean>;
        noDecoIgnored: FormControl<boolean>;
        missingAirBreak: FormControl<boolean>;
    }>;

    constructor(
        public units: UnitConversion,
        private settingsNormalization: SettingsNormalizationService,
        private views: SubViewStorage,
        public appSettings: ApplicationSettingsService,
        private dispatcher: ReloadDispatcher,
        private formBuilder: NonNullableFormBuilder,
        private cd: ChangeDetectorRef,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public location: Location) {
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get maxDensityInvalid(): boolean {
        const control = this.settingsForm.controls.maxDensity;
        return this.inputs.controlInValid(control);
    }

    public get primaryTankReserveInvalid(): boolean {
        const control = this.settingsForm.controls.primaryTankReserve;
        return this.inputs.controlInValid(control);
    }

    public get stageTankReserveInvalid(): boolean {
        const control = this.settingsForm.controls.stageTankReserve;
        return this.inputs.controlInValid(control);
    }

    public get densityStep(): number {
        return Math.pow(0.1, this.ranges.densityRounding);
    }

    private get maxDensity(): number {
        return Precision.round(this.appSettings.maxGasDensity, this.ranges.densityRounding);
    }

    private get primaryTankReserve(): number {
        return Precision.round(this.appSettings.primaryTankReserve);
    }

    private get stageTankReserve(): number {
        return Precision.round(this.appSettings.stageTankReserve);
    }

    public ngOnInit(): void {
        // we can't use view state here, because wouldn't be able to see the current state
        // see also use method

        this.settingsForm = this.formBuilder.group({
            imperialUnits: [this.units.imperialUnits, [Validators.required]],
            maxDensity: [this.maxDensity, this.validators.maxDensity],
            primaryTankReserve: [this.primaryTankReserve, this.validators.tankPressure],
            stageTankReserve: [this.stageTankReserve, this.validators.tankPressure],
            densityIgnored: [this.appSettings.densityIgnored, [Validators.required]],
            icdIgnored: [this.appSettings.icdIgnored, [Validators.required]],
            noDecoIgnored: [this.appSettings.noDecoIgnored, [Validators.required]],
            missingAirBreak: [this.appSettings.missingAirBreakIgnored, [Validators.required]]
        });
    }

    /**
     * This is the only one component, which does not save data directly,
     * because it is used in calculation, and user can't roll back otherwise.
     **/
    public use(): void {
        if (this.settingsForm.invalid) {
            return;
        }

        const newValues = this.settingsForm.value;
        this.appSettings.icdIgnored = Boolean(newValues.icdIgnored);
        this.appSettings.densityIgnored = Boolean(newValues.densityIgnored);
        this.appSettings.noDecoIgnored = Boolean(newValues.noDecoIgnored);
        this.appSettings.missingAirBreakIgnored = Boolean(newValues.missingAirBreak);
        this.appSettings.maxGasDensity = Number(newValues.maxDensity);
        this.appSettings.primaryTankReserve = Number(newValues.primaryTankReserve);
        this.appSettings.stageTankReserve = Number(newValues.stageTankReserve);
        // apply imperial last, to be able to apply in current units
        this.units.imperialUnits = Boolean(newValues.imperialUnits);

        this.settingsNormalization.apply();
        this.views.reset();
        this.reLoad();
        this.dispatcher.sendSetSimple(); // the only one event, which triggers all dives calculation

        // only to recheck the form validity
        this.cd.detectChanges();
    }

    /** don't apply yet, let the user confirm */
    public resetToDefault(): void {
        this.settingsForm.patchValue({
            imperialUnits: false,
            // needs to be in current units, because range is not applied yet
            maxDensity: Precision.round(this.appSettings.defaultMaxGasDensity, this.ranges.densityRounding),
            primaryTankReserve: Precision.round(this.appSettings.defaultPrimaryTankReserve),
            stageTankReserve: Precision.round(this.appSettings.defaultStageTankReserve),
            icdIgnored: false,
            densityIgnored: false,
            noDecoIgnored: false,
            missingAirBreak: false,
        });
    }

    private reLoad(): void {
        // the ignored issues don't have to be reloaded, since they are not affected by normalization
        this.settingsForm.patchValue({
            maxDensity: this.maxDensity,
            primaryTankReserve: this.primaryTankReserve,
            stageTankReserve: this.stageTankReserve,
        });
    }

    protected readonly icon = faBatteryHalf;
}
