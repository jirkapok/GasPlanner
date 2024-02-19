import {Component, Input, OnInit} from '@angular/core';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss'],
    animations: [
        trigger('labelState',[
            state('primary', style({
                transform: 'rotateX(180deg)',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
            })),
            state('secondary', style({ transform: 'none'})),
            state('disabled', style({
                visibility: 'hidden',
                transform: 'translateY(21px)',
            })),
            transition('disabled => secondary', [animate('400ms')]),
            transition('secondary => primary', [animate('500ms')]),
            transition('primary => disabled', [animate('400ms', keyframes([
                style({transform: 'rotateX(180deg)', offset: 0}),
                style({transform: 'rotateX(180deg) translateY(-21px)', offset: 1})
            ]))]),
        ]),
    ]
})
export class DiffTabsButtonComponent implements OnInit {
    @Input({required: true}) index = 0;
    public state = 'disabled';

    constructor(private profileComparatorService: ProfileComparatorService) {
    }

    public get isEnabled(): boolean {
        return this.state !== 'disabled';
    }

    public ngOnInit() {

        this.profileComparatorService.profileBIndex.subscribe((value) => {
            if (value === this.index) {
                this.enableSecondaryProfile();
            }
        });

        this.profileComparatorService.profileAIndex.subscribe((value) => {
            if (value === this.index){
                this.enablePrimaryProfile();
            }

            if(this.isEnabled && value !== this.index){
                this.disableProfile();
            }
        });

    }

    public clicked() {
        this.profileComparatorService.appendProfileToProfileComparison(this.index);
    }

    private enablePrimaryProfile() {
        this.state = 'primary';
    }

    private enableSecondaryProfile() {
        this.state = 'secondary';
    }

    private disableProfile() {
        this.state = 'disabled';
    }
}
