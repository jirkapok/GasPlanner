import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Salinity } from 'scuba-physics';

@Component({
    selector: 'app-salinity',
    templateUrl: './salinity.component.html',
    styleUrls: ['./salinity.component.css']
})
export class SalinityComponent {
    @Output()
    public salinityChange = new EventEmitter<Salinity>();
    public readonly freshName = 'Fresh';
    public readonly brackishName = 'Brackish (EN13319)';
    public readonly saltName = 'Salt';
    private _salinity: Salinity = Salinity.fresh;

    @Input()
    public get salinity(): Salinity {
        return this._salinity;
    }

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

    public set salinity(newValue: Salinity) {
        this._salinity = newValue;
        this.salinityChange.emit(this._salinity);
    }

    public useFresh(): void {
        this._salinity = Salinity.fresh;
        this.salinityChange.emit(this._salinity);
    }

    public useBrackish(): void {
        this._salinity = Salinity.brackish;
        this.salinityChange.emit(this._salinity);
    }

    public useSalt(): void {
        this._salinity = Salinity.salt;
        this.salinityChange.emit(this._salinity);
    }
}
