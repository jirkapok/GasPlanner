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
        const ranges = this.units.ranges;
        this.options.decoStopDistance = ranges.decoStopDistance;
        this.options.minimumAutoStopDepth = ranges.minimumAutoStopDepth;
        this.options.lastStopDepth = ranges.lastStopDepthDefault;
        this.planner.assignOptions(this.options);
    }

    private applyToTanks(): void {
        // TODO round values of tanks
    }
}
