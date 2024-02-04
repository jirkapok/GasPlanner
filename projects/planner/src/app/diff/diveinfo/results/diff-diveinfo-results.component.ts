import {Component} from '@angular/core';
import {ViewSwitchService} from '../../../shared/viewSwitchService';
import {UnitConversion} from '../../../shared/UnitConversion';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';
import {DiveResults} from '../../../shared/diveresults';
import {formatNumber} from '@angular/common';

@Component({
    selector: 'app-diff-diveinfo-results',
    templateUrl: './diff-diveinfo-results.component.html',
    styleUrls: ['./diff-diveinfo-results.component.scss']
})
export class DiveInfoResultsDifferenceComponent {

    constructor(
        private viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        private profileComparatorService: ProfileComparatorService) {
    }
    public get profileA(): DiveResults {
        return this.profileComparatorService.profileAResults();
    }

    public get isReady(): boolean {
        return this.profileComparatorService.isReady();
    }

    public get isDiveInfoReady(): boolean {
        return this.profileComparatorService.isDiveInfoReady();
    }

    public get isProfileReady(): boolean {
        return this.profileComparatorService.isProfileReady();
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get needsReturn(): boolean {
        return this.profileA.needsReturn;
    }

    public showMaxBottomTimeOfProfile(profile: DiveResults): boolean {
        return profile.maxTime > 0;
    }

    public noDecoOfProfile(profile: DiveResults): number {
        return profile.noDecoTime;
    }

    public averageDepthOfProfile(profile: DiveResults): number {
        return this.units.fromMeters(profile.averageDepth);
    }

    public highestDensityOfProfile(profile: DiveResults): number {
        const density = profile.highestDensity.density;
        return this.units.fromGramPerLiter(density);
    }

    public densityTextOfProfile(profile: DiveResults): string {
        const gas = profile.highestDensity.gas.name;
        const depth = this.units.fromMeters(profile.highestDensity.depth);
        return `${gas} at ${depth} ${this.units.length}`;
    }

    public cnsTextOfProfile(profile: DiveResults): string {
        if(profile.cns >= 1000) {
            return '> 1000';
        }

        return formatNumber(profile.cns, 'en', '1.0-0');
    }
}
