import { ImperialUnits, MetricUnits, Units } from 'scuba-physics';

export class UnitConversion {
    private _imperialUnits = true;
    private current: Units = new ImperialUnits();
    private _ranges: RangeConstants = new MetricRanges(this.current);

    public get ranges(): RangeConstants {
        return this._ranges;
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
            // TODO Replace with ImperialRanges
            this._ranges = new MetricRanges(this.current);
        }
    }
}


export interface RangeConstants {
    tankSize: [number, number];
    tankSizeLabel: string;
    tankPressure: [number, number];
    tankPressureLabel: string;
    nitroxOxygen: [number, number];
    nitroxOxygenLabel: string;
    trimixOxygen: [number, number];
    trimixOxygenLabel: string;
    tankHe: [number, number];
    tankHeLabel: string;
    diverSac: [number, number];
    diverSacLabel: string;
    ppO2: [number, number];
    depth: [number, number];
    depthLabel: string;
    duration: [number, number];
    durationLabel: string;
}

const toLabel = (range: [number, number], unit: string): string => `${range[0]} - ${range[1]} ${unit}`;

class MetricRanges implements RangeConstants {
    public tankSize: [number, number] = [1, 50];
    public tankSizeLabel: string = toLabel(this.tankSize, this.units.volumeShortcut);
    public tankPressure: [number, number] = [30, 350];
    public tankPressureLabel: string = toLabel(this.tankPressure, this.units.pressureShortcut);
    public nitroxOxygen: [number, number] = [21, 100];
    public nitroxOxygenLabel: string = toLabel(this.nitroxOxygen, '%');
    public trimixOxygen: [number, number] = [1, 100];
    public trimixOxygenLabel: string = toLabel(this.trimixOxygen, '%');
    public tankHe: [number, number] = [0, 99];
    public tankHeLabel: string = toLabel(this.tankHe, '%');
    public diverSac: [number, number] = [5, 90];
    public diverSacLabel: string = toLabel(this.diverSac, this.units.volumeShortcut + '/min');
    public ppO2: [number, number] = [0.21, 3];
    public depth: [number, number] = [1,350];
    public depthLabel: string = toLabel(this.depth, this.units.lengthShortcut);
    public duration: [number, number] = [1,1440];
    public durationLabel: string = toLabel(this.duration, 'min');

    // TODO add speed, altitude

    constructor(private units: Units) {}
}


class ImperialRanges { // TODO implements RangeConstants  {
    constructor(private units: Units) {}
}
