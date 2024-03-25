import { Component } from '@angular/core';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { DiveResults } from '../../../shared/diveresults';
import { formatNumber } from '@angular/common';
import { faArrowDown, faArrowUp, faMinus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { TextConstants } from '../../../shared/TextConstants';

// TODO extract ResultDiff to injectable service, resolve selected profiles updates
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

class DiveResulsDiff {
    public totalDuration = new ResultDiff(this.profileA, this.profileB, 1,
        d => d.totalDuration);
    public timeToSurface = new ResultDiff(this.profileA, this.profileB, -1,
        d => d.timeToSurface);
    public averageDepth = new ResultDiff(this.profileA, this.profileB, -1,
        d => this.units.fromMeters(d.averageDepth));
    public emergencyAscentStart = new ResultDiff(this.profileA, this.profileB, -1,
        d => d.emergencyAscentStart);
    public noDeco = new ResultDiff(this.profileA, this.profileB, 1,
        d => d.noDecoTime);
    public maxTime = new ResultDiff(this.profileA, this.profileB, 1,
        d => d.maxTime);
    public highestDensity = new ResultDiff(this.profileA, this.profileB, -1,
        d => this.density(d));
    public otu = new ResultDiff(this.profileA, this.profileB, -1,
        d => d.otu);
    public cns = new ResultDiff(this.profileA, this.profileB, -1,
        d => d.cns);

    private readonly maxCns = 1000;
    private readonly cnsDifferenceUnderMinusOneThousand = '< -1000';

    public constructor(private units: UnitConversion, private profileA: DiveResults, private profileB: DiveResults) {
    }

    public get densityGasA(): string {
        return this.densityFormatted(this.profileA);
    }

    public get densityGasB(): string {
        return this.densityFormatted(this.profileA);
    }

    public get cnsA(): string {
        return this.cnsFormatted(this.profileA);
    }

    public get cnsB(): string {
        return this.cnsFormatted(this.profileA);
    }

    public get cnsDifference(): string {
        const diff = this.cns.difference;

        if(diff >= this.maxCns) {
            return TextConstants.cnsOverOneThousand;
        }

        if(diff <= -this.maxCns) {
            return this.cnsDifferenceUnderMinusOneThousand;
        }

        return formatNumber(diff, 'en', '1.0-0');
    }

    public get showMaxBottomTime(): boolean {
        return this.profileA.maxTime > 0 && this.profileB.maxTime > 0;
    }

    private densityFormatted(profile: DiveResults): string {
        const gas = profile.highestDensity.gas.name;
        const depth = this.units.fromMeters(profile.highestDensity.depth);
        return `${gas} at ${depth} ${this.units.length}`;
    }

    private density(profile: DiveResults): number {
        const density = profile.highestDensity.density;
        return this.units.fromGramPerLiter(density);
    }

    private cnsFormatted(profile: DiveResults): string {
        if(profile.cns >= this.maxCns) {
            return TextConstants.cnsOverOneThousand;
        }

        return formatNumber(profile.cns, 'en', '1.0-0');
    }
}

@Component({
    selector: 'app-diff-diveresults-table',
    templateUrl: './diff-diveresults-table.component.html',
    styleUrls: ['./diff-diveresults-table.component.scss', '../../diff.component.scss']
})
export class DiveResultsTableDifferenceComponent {
    public constructor(
        public viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        public profilesDiff: ProfileComparatorService) {
    }

    public get diff(): DiveResulsDiff {
        return new DiveResulsDiff(this.units, this.profileA, this.profileB);
    }

    public get profileA(): DiveResults {
        return this.profilesDiff.profileAResults;
    }

    public get profileB(): DiveResults {
        return this.profilesDiff.profileBResults;
    }

    public get diveInfosCalculated(): boolean {
        return this.profilesDiff.diveInfosCalculated;
    }

    public get areProfilesCalculated(): boolean {
        return this.profilesDiff.profilesCalculated;
    }
}
