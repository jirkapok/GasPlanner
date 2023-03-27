import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, Validators, FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { Diver } from 'scuba-physics';
import { OptionsService } from '../shared/options.service';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
    public flagIcon = faFlag;
    public diver = new Diver();
    public settingsForm!: FormGroup<{
        imperialUnits: FormControl<boolean>;
    }>;

    constructor(public units: UnitConversion,
        private settingsNormalization: SettingsNormalizationService,
        private formBuilder: NonNullableFormBuilder,
        private router: Router,
        private cd: ChangeDetectorRef,
        private options: OptionsService) {
        this.diver.loadFrom(this.options.diver);
    }

    public ngOnInit(): void {
        this.settingsForm = this.formBuilder.group({
            imperialUnits: [this.units.imperialUnits, [Validators.required]]
        });
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        if(this.settingsForm.invalid) {
            return;
        }

        const imperialUnits = Boolean(this.settingsForm.controls.imperialUnits.value);
        this.options.applyDiver(this.diver);
        this.units.imperialUnits = imperialUnits;
        this.settingsNormalization.apply();
        // only to recheck the form validity
        this.cd.detectChanges();
    }
}
