import { Component } from '@angular/core';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { DiveResults } from '../../../shared/diveresults';
import { ResultsComparison } from './results-comparison.service';

@Component({
    selector: 'app-diff-diveresults-table',
    templateUrl: './diff-diveresults-table.component.html',
    styleUrls: ['./diff-diveresults-table.component.scss', '../../diff.component.scss']
})
export class DiveResultsTableDifferenceComponent {
    public constructor(
        public viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        public profilesDiff: ProfileComparatorService,
        public resultsDiff: ResultsComparison) {
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
