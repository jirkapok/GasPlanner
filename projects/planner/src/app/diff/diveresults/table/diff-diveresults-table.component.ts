import { Component } from '@angular/core';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/profileComparatorService';
import { DiveResults } from '../../../shared/diveresults';
import { formatNumber } from '@angular/common';
import { faArrowDown, faArrowUp, faMinus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { TextConstants } from '../../../shared/TextConstants';

class ResultDiff {
    private arrowUp: IconDefinition = faArrowUp;
    private arrowDown: IconDefinition = faArrowDown;
    private dash: IconDefinition = faMinus;

    constructor(
        private profileA: DiveResults,
        private profileB: DiveResults,
        private betterDirection: number,
        private valueAccessor: (result: DiveResults) => number,
    ) { }

    public get valueA(): number {
        return this.valueAccessor(this.profileA);
    }

    public get valueB(): number {
        return this.valueAccessor(this.profileB);
    }

    public get difference(): number {
        return this.valueB - this.valueA;
    }

    public get arrow(): IconDefinition {
        if(this.difference > 0) {
            return this.arrowUp;
        }

        if (this.difference < 0) {
            return this.arrowDown;
        }

        return this.dash;
    }

    public get bgColor(): string {
        const projectedValue = this.betterDirection * this.difference;

        if (projectedValue > 0){
            return 'table-success';
        }

        if (projectedValue < 0){
            return 'table-danger';
        }

        return 'table-active';
    }
}

@Component({
    selector: 'app-diff-diveresults-table',
    templateUrl: './diff-diveresults-table.component.html',
    styleUrls: ['./diff-diveresults-table.component.scss', '../../diff.component.scss']
})
export class DiveResultsTableDifferenceComponent {
    public diff = {
        totalDuration: new ResultDiff(this.profileA, this.profileB, 1, d => d.totalDuration),
        timeToSurface: new ResultDiff(this.profileA, this.profileB, -1, d => d.timeToSurface),
        averageDepth: new ResultDiff(this.profileA, this.profileB, -1, d => d.averageDepth),
        emergencyAscentStart: new ResultDiff(this.profileA, this.profileB, -1, d => d.emergencyAscentStart),
        noDeco: new ResultDiff(this.profileA, this.profileB, 1, d => d.noDecoTime),
        maxTime: new ResultDiff(this.profileA, this.profileB, 1, d => d.maxTime),
        highestDensity: new ResultDiff(this.profileA, this.profileB, -1, d => d.highestDensity.density),
        otu: new ResultDiff(this.profileA, this.profileB, -1, d => d.otu),
        cns: new ResultDiff(this.profileA, this.profileB, -1, d => d.cns),
    };

    private readonly cnsDifferenceUnderMinusOneThousand = '< -1000';

    constructor(
        public viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        public profilesDiff: ProfileComparatorService) {
    }

    public get profileA(): DiveResults {
        return this.profilesDiff.profileAResults;
    }

    public get profileB(): DiveResults {
        return this.profilesDiff.profileBResults;
    }

    public get diveInfosCalculated(): boolean {
        return this.profilesDiff.areDiveInfosCalculated();
    }

    public get areProfilesCalculated(): boolean {
        return this.profilesDiff.areProfilesCalculated();
    }

    public cnsDifferenceText(diff: number): string {
        if(diff >= 1000) {
            return TextConstants.cnsOverOneThousand;
        }

        if(diff <= -1000) {
            return this.cnsDifferenceUnderMinusOneThousand;
        }

        return formatNumber(diff, 'en', '1.0-0');
    }

    public showMaxBottomTimeOfProfile(profile: DiveResults): boolean {
        return profile.maxTime > 0;
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
            return TextConstants.cnsOverOneThousand;
        }

        return formatNumber(profile.cns, 'en', '1.0-0');
    }
}
