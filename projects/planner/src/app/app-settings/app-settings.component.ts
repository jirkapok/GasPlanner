import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { Diver } from 'scuba-physics';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { PlannerService } from '../shared/planner.service';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.css']
})
export class AppSettingsComponent {
    public flagIcon = faFlag;
    public diver = new Diver();
    public imperialUnits = false;

    constructor(private router: Router, public units: UnitConversion,
        private options: OptionsDispatcherService,
        private planner: PlannerService) {
        this.imperialUnits = this.units.imperialUnits;
        this.diver.loadFrom(this.planner.diver);
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        // TODO save settings only if form is valid
        this.planner.applyDiver(this.diver);
        this.units.imperialUnits = this.imperialUnits;
        this.applyToOptions();
        this.applyToTanks();
    }

    private applyToOptions(): void {
        this.options.applyDiver(this.diver);
        // options need to be in metrics only
        this.options.decoStopDistance = this.units.toMeters(this.units.stopsDistance);
        // unable to fit the stop, the lowest value is always the minimum distance
        this.options.lastStopDepth = this.units.toMeters(this.units.stopsDistance);
        this.options.minimumAutoStopDepth = this.units.toMeters(this.units.autoStopLevel);
        // TODO apply also rounded MND limit
        this.planner.assignOptions(this.options);
    }

    private applyToTanks(): void {
        // TODO round values of tanks
    }
}
