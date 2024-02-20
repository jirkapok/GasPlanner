import {Component} from '@angular/core';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-diff-diveinfo',
    templateUrl: './diff-diveinfo.component.html',
    styleUrls: ['./diff-diveinfo.component.scss']
})
export class DiveInfoDifferenceComponent {
    public icon = faSlidersH;
}
