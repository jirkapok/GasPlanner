import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { Diver } from 'scuba-physics';
import { PlannerService } from '../shared/planner.service';
import { SettingsNormalizationService } from '../shared/settings-normalization.service';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.css']
})
export class AppSettingsComponent implements OnInit {
    public flagIcon = faFlag;
    public diver = new Diver();
    public settingsForm!: FormGroup;

    constructor(public units: UnitConversion,
        private settingsNormalization: SettingsNormalizationService,
        private formBuilder: FormBuilder,
        private router: Router,
        private planner: PlannerService) {
        this.diver.loadFrom(this.planner.diver);
    }

    public ngOnInit(): void {
        this.settingsForm = this.formBuilder.group({
            imperialUnits: [this.units.imperialUnits,  Validators.required]
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
    }
}
