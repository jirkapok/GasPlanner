import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Salinity } from 'scuba-physics';

@Component({
    selector: 'app-salinity',
    templateUrl: './salinity.component.html',
    styleUrls: ['./salinity.component.scss'],
    standalone: false
})
export class SalinityComponent {
    @Input()
    public salinity: Salinity = Salinity.fresh;

    @Output()
    public inputChange = new EventEmitter<Salinity>();

    public readonly freshName = 'Fresh';
    public readonly brackishName = 'Brackish (EN13319)';
    public readonly saltName = 'Salt';

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
