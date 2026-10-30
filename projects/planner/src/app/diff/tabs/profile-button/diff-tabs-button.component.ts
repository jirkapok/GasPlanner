import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';

type ProfileState = 'primary' | 'secondary' | 'disabled';

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

    constructor(private profilesDiff: ProfileComparatorService) {}

    protected get state(): ProfileState {
        if (this.index === this.profilesDiff.profileAIndex) return 'primary';
        if (this.index === this.profilesDiff.profileBIndex) return 'secondary';
        return 'disabled';
    }

    protected get selected(): boolean {
        return this.state !== 'disabled';
    }

    protected selectProfile(): void {
        this.profilesDiff.selectProfile(this.index);
    }
}
