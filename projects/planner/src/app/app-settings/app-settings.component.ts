import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, Validators, FormControl
} from '@angular/forms';
import { Location } from '@angular/common';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';
import { OptionsService } from '../shared/options.service';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';
import { SubViewStorage } from '../shared/subViewStorage';
import { DiverOptions } from '../shared/models';
import {DiveSchedules} from '../shared/dive.schedules';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
    public flagIcon = faFlag;
    public diverIcon = faUserCog;

    public diver: DiverOptions;
    public settingsForm!: FormGroup<{
        imperialUnits: FormControl<boolean>;
    }>;

    constructor(
        public units: UnitConversion,
        private settingsNormalization: SettingsNormalizationService,
        private formBuilder: NonNullableFormBuilder,
        private cd: ChangeDetectorRef,
        private schedules: DiveSchedules,
        private views: SubViewStorage,
        public location: Location) {
        this.diver = new DiverOptions();
        this.diver.loadFrom(this.selectedOptions.diverOptions);
    }

    // consider use to all dives not only to currently selected
    private get selectedOptions(): OptionsService {
        return this.schedules.selected.optionsService;
    }

    public ngOnInit(): void {
        this.settingsForm = this.formBuilder.group({
            imperialUnits: [this.units.imperialUnits, [Validators.required]]
        });
    }

    public use(): void {
        if (this.settingsForm.invalid) {
            return;
        }

        const imperialUnits = Boolean(this.settingsForm.controls.imperialUnits.value);
        this.selectedOptions.applyDiver(this.diver);
        this.units.imperialUnits = imperialUnits;
        this.settingsNormalization.apply();
        this.views.reset();
        // only to recheck the form validity
        this.cd.detectChanges();
    }
}
