import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { ResultsComparison } from '../../../shared/diff/results-comparison.service';
import { DiveResults } from '../../../shared/diveresults';
import { CalculatingComponent } from '../../../controls/calculating/calculating.component';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DurationPipe } from '../../../pipes/duration.pipe';
import { LocaleNumberPipe } from '../../../pipes/locale-number.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-diff-diveresults-table',
    templateUrl: './diff-diveresults-table.component.html',
    styleUrls: ['./diff-diveresults-table.component.scss', '../../diff.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CalculatingComponent, FaIconComponent, LocaleNumberPipe, DurationPipe, TranslatePipe]
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
