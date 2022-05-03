import { ImperialUnits, MetricUnits, Units } from 'scuba-physics';

export class UnitConversion {
    private _imperialUnits = true;
    private current: Units = new ImperialUnits();
    private _ranges: RangeConstants = new MetricRanges(this.current);

    public get ranges(): RangeConstants {
        return this._ranges;
    }

    public get imperialUnits(): boolean {
        return this._imperialUnits;
    }

    public set imperialUnits(newValue: boolean) {
        this._imperialUnits = newValue;

        if (this._imperialUnits) {
            this.current = new ImperialUnits();
            this._ranges = new MetricRanges(this.current);
        } else {
            this.current = new MetricUnits();
            this._ranges = new MetricRanges(this.current);
        }
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


export interface RangeConstants {
    tankSize: [number, number];
    tankSizeLabel: string;
    tankPressure: [number, number];
    tankPressureLabel: string;
    tankOxygen: [number, number];
    tankOxygenLabel: string;
}

const toLabel = (range: [number, number], unit: string): string => `${range[0]} - ${range[1]} ${unit}`;

class MetricRanges implements RangeConstants {
    public tankSize: [number, number] = [1, 50];
    public tankSizeLabel: string = toLabel(this.tankSize, this.units.volumeShortcut);
    public tankPressure: [number, number] = [30, 350];
    public tankPressureLabel: string = toLabel(this.tankPressure, this.units.pressureShortcut);
    public tankOxygen: [number, number] = [1, 100];
    public tankOxygenLabel: string = toLabel(this.tankOxygen, '%');

    constructor(private units: Units) {}
}


class ImperialRanges { //implements RangeConstants  {
    constructor(private units: Units) {}
}
