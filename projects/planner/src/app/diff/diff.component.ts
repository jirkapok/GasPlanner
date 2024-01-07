import {Component} from '@angular/core';
import {ProfileComparatorService} from '../shared/profileComparatorService';

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss']
})
export class DiffComponent {
    constructor(public profileComparatorService: ProfileComparatorService) {
    }
}
