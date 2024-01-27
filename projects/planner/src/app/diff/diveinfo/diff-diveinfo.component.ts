import {Component} from '@angular/core';
import {DiveResults} from '../../shared/diveresults';
import {UnitConversion} from '../../shared/UnitConversion';
import {ProfileComparatorService} from '../../shared/profileComparatorService';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import {ViewSwitchService} from '../../shared/viewSwitchService';
import {formatNumber} from '@angular/common';

@Component({
    selector: 'app-diff-diveinfo',
    templateUrl: './diff-diveinfo.component.html',
    styleUrls: ['./diff-diveinfo.component.scss']
})
export class DiveInfoDifferenceComponent {
    public icon = faSlidersH;

    constructor(
        private viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        private profileComparatorService: ProfileComparatorService) {
    }
    public get dive(): DiveResults {
        return this.profileComparatorService.profileAResults();
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get showMaxBottomTime(): boolean {
        return this.dive.maxTime > 0;
    }

    public get noDeco(): number {
        return this.dive.noDecoTime;
    }

    public get averageDepth(): number {
        return this.units.fromMeters(this.dive.averageDepth);
    }

    public get highestDensity(): number {
        const density = this.dive.highestDensity.density;
        return this.units.fromGramPerLiter(density);
    }

    public get densityText(): string {
        const gas = this.dive.highestDensity.gas.name;
        const depth = this.units.fromMeters(this.dive.highestDensity.depth);
        return `${gas} at ${depth} ${this.units.length}`;
    }

    public get cnsText(): string {
        if(this.dive.cns >= 1000) {
            return '> 1000';
        }

        return formatNumber(this.dive.cns, 'en', '1.0-0');
    }

}
