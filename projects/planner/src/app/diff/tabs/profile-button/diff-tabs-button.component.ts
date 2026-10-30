import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslatePipe]
})
export class DiffTabsButtonComponent {
    @Input({ required: true }) index = 0;
    @Input({ required: true }) title = '';
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
