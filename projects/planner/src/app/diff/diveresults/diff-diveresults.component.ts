import {Component} from '@angular/core';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-diff-diveresults',
    templateUrl: './diff-diveresults.component.html',
    styleUrls: ['./diff-diveresults.component.scss']
})
export class DiveInfoDifferenceComponent {
    public icon = faSlidersH;
}
