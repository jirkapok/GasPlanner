import { ImperialUnits, MetricUnits, Units } from 'scuba-physics';

export class UnitConversion {
    private _imperialUnits = false;
    private current: Units = new MetricUnits();

    public get imperialUnits(): boolean {
        return this._imperialUnits;
    }

    public set imperialUnits(newValue: boolean) {
        this._imperialUnits = newValue;
        this.current = this._imperialUnits ? new ImperialUnits() : new MetricUnits();
    }

    public get label(): string {
        return `${this.current.name} (${this.current.lengthShortcut}, ${this.current.pressureShortcut}, ${this.current.volumeShortcut})`;
    }
}
