import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
    NonNullableFormBuilder, FormGroup, Validators, FormControl
} from '@angular/forms';
import { Router } from '@angular/router';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { Diver } from 'scuba-physics';
import { PlannerService } from '../shared/planner.service';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';

interface SettingsForm {
    imperialUnits: FormControl<boolean>;
}

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
    public flagIcon = faFlag;
    public diver = new Diver();
    public settingsForm!: FormGroup<SettingsForm>;

    constructor(public units: UnitConversion,
        private settingsNormalization: SettingsNormalizationService,
        private formBuilder: NonNullableFormBuilder,
        private router: Router,
        private cd: ChangeDetectorRef,
        private planner: PlannerService) {
        this.diver.loadFrom(this.planner.diver);
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
        this.settingsNormalization.apply(this.diver, imperialUnits);
        // only to recheck the form validity
        this.cd.detectChanges();
    }
}
