import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { Salinity } from 'scuba-physics';

import { ReactiveFormsModule } from '@angular/forms';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-salinity',
    templateUrl: './salinity.component.html',
    styleUrls: ['./salinity.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
    ReactiveFormsModule,
    MdbFormsModule,
    MdbDropdownModule,
    TranslatePipe
],
})
export class SalinityComponent {
    @Input()
    public salinity: Salinity = Salinity.fresh;

    @Output()
    public inputChange = new EventEmitter<Salinity>();

    public readonly freshName = 'salinity.fresh';
    public readonly brackishName = 'salinity.brackish';
    public readonly saltName = 'salinity.salt';

    public get salinityOption(): string {
        switch (this.salinity) {
        case Salinity.salt:
            return this.saltName;
        case Salinity.brackish:
            return this.brackishName;
        default:
            return this.freshName;
        }
    }

    public useFresh(): void {
        this.salinity = Salinity.fresh;
        this.inputChange.emit(this.salinity);
    }

    public useBrackish(): void {
        this.salinity = Salinity.brackish;
        this.inputChange.emit(this.salinity);
    }

    public useSalt(): void {
        this.salinity = Salinity.salt;
        this.inputChange.emit(this.salinity);
    }
}
