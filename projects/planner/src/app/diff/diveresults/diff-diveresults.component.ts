import {Component} from '@angular/core';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DiveResultsTableDifferenceComponent } from './table/diff-diveresults-table.component';

@Component({
    selector: 'app-diff-diveresults',
    templateUrl: './diff-diveresults.component.html',
    styleUrls: ['./diff-diveresults.component.scss'],
    imports: [FaIconComponent, DiveResultsTableDifferenceComponent]
})
export class DiveResultsDifferenceComponent {
    public icon = faSlidersH;
}
