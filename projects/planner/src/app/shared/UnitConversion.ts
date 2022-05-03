import { ImperialUnits, MetricUnits, Units } from 'scuba-physics';

export class UnitConversion {
    private _imperialUnits = true;
    private current: Units = new ImperialUnits();

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

    public get length(): string {
        return this.current.lengthShortcut;
    }

    public get pressure(): string {
        return this.current.pressureShortcut;
    }

    public get volume(): string {
        return this.current.volumeShortcut;
    }

    public get lastSpeedLevel(): number {
        return this._imperialUnits ? 20 : 6;
    }

    public get autoStopLevel(): number {
        return this._imperialUnits ? 33 : 10;
    }
}
