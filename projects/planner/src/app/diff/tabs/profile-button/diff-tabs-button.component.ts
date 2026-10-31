import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntil } from 'rxjs';
import { Streamed } from '../../../shared/streamed';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';

type ProfileState = 'primary' | 'secondary' | 'disabled';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss'],
    imports: [TranslatePipe]
})
export class DiffTabsButtonComponent extends Streamed {
    @Input({ required: true }) index = 0;
    @Input({ required: true }) title = '';

    constructor(
        private profilesDiff: ProfileComparatorService,
        private cd: ChangeDetectorRef
    ) {
        super();

        profilesDiff.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.cd.markForCheck());
    }

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
