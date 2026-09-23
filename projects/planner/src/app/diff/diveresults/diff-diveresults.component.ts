import {Component, ChangeDetectionStrategy} from '@angular/core';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DiveResultsTableDifferenceComponent } from './table/diff-diveresults-table.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-diff-diveresults',
    templateUrl: './diff-diveresults.component.html',
    styleUrls: ['./diff-diveresults.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, DiveResultsTableDifferenceComponent, TranslatePipe]
})
export class DiveResultsDifferenceComponent {
    public icon = faSlidersH;
}
