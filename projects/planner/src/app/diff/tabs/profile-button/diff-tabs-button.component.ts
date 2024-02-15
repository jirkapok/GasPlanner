import {Component, Input, OnInit} from '@angular/core';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss']
})
export class DiffTabsButtonComponent implements OnInit {
    @Input({required: true}) index = 0;
    buttonFill = 'btn-outline-primary';
    private enabled = false;

    constructor(private profileComparatorService: ProfileComparatorService) {
    }

    public ngOnInit() {
        this.profileComparatorService.profileAIndex.subscribe((value) => {
            if(this.enabled && value !== this.index){
                this.disableProfile();
            }
        });

        this.profileComparatorService.profileBIndex.subscribe((value) => {
            if (value === this.index) {
                this.enableProfile();
            }
        });
    }

    public clicked() {
        this.profileComparatorService.appendProfileToProfileComparison(this.index);
    }

    private enableProfile() {
        this.buttonFill = 'btn-primary';
        this.enabled = true;
    }

    private disableProfile() {
        this.buttonFill = 'btn-outline-primary';
        this.enabled = false;
    }
}
