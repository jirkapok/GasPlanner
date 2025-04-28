import { Component, Input } from '@angular/core';
import {
    animate, keyframes, state, style, transition, trigger
} from '@angular/animations';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss'],
    animations: [
        trigger('labelState', [
            state('primary', style({
                transform: 'rotateX(180deg)',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
            })),
            state('secondary', style({ transform: 'none' })),
            state('disabled', style({
                visibility: 'hidden',
                transform: 'translateY(21px)',
            })),
            transition('disabled => secondary', [animate('400ms')]),
            transition('secondary => primary', [animate('500ms')]),
            transition('primary => disabled', [animate('400ms', keyframes([
                    style({ transform: 'rotateX(180deg)', offset: 0 }),
                    style({ transform: 'rotateX(180deg) translateY(-21px)', offset: 1 })
                ]))]),
        ]),
    ],
    standalone: false
})
export class DiffTabsButtonComponent {
    @Input({required: true}) index = 0;
    @Input({required: true}) title = '';
    private readonly disabled = 'disabled';

    public constructor(private profilesDiff: ProfileComparatorService) {
    }

    public get state(): string {
        if(this.index === this.profilesDiff.profileAIndex) {
            return 'primary';
        }

        if(this.index === this.profilesDiff.profileBIndex) {
            return 'secondary';
        }

        return this.disabled;
    }

    public get selected(): boolean {
        return this.state !== this.disabled;
    }

    public selectProfile() {
        this.profilesDiff.selectProfile(this.index);
    }
}
