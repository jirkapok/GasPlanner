import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ProfileComparatorService } from '../shared/diff/profileComparatorService';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss']
})
export class DiffComponent {
    public readonly exclamation = faExclamationCircle;

    constructor(public diff: ProfileComparatorService, private location: Location) {
    }

    public goToDashboard(): void {
        this.location.go('/');
    }
}
