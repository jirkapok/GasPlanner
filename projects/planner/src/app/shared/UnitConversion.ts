import { BehaviorSubject } from 'rxjs';
import { ImperialUnits, MetricUnits, Units } from 'scuba-physics';

export class UnitConversion {
    public ranges: RangeConstants;
    /**
     * Only to be able immediately refresh Diver component, since in the same view.
     * Other components refresh next time their are shown.
     */
    public ranges$: BehaviorSubject<RangeConstants>;
    private _imperialUnits = false;
    private current: Units;

    constructor() {
        this.current = new MetricUnits();
        this.ranges = new MetricRanges(this.current);
        this.ranges$ = new BehaviorSubject<RangeConstants>(this.ranges);
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

    public get altitude(): string {
        return this.current.altitudeShortcut;
    }

    public get speed(): string {
        return this.length + perMinute;
    }

    public get sac(): string {
        return this.pressure + perMinute;
    }

    public get rmv(): string {
        return this.volume + perMinute;
    }

    public get lastSpeedLevel(): number {
        return this.current.lastSpeedLevel;
    }

    public get autoStopLevel(): number {
        return this.current.autoStopLevel;
    }

    public get imperialUnits(): boolean {
        return this._imperialUnits;
    }

    public set imperialUnits(newValue: boolean) {
        this._imperialUnits = newValue;

        if (this._imperialUnits) {
            this.current = new ImperialUnits();
            this.ranges = new ImperialRanges(this.current);
        } else {
            this.current = new MetricUnits();
            this.ranges = new MetricRanges(this.current);
        }

        this.ranges$.next(this.ranges);
    }

    public static createMetricRanges(): RangeConstants {
        return new MetricRanges(new MetricUnits());
    }

    public toLiter(volume: number): number {
        return this.current.toLiter(volume);
    }

    public fromLiter(liters: number): number {
        return this.current.fromLiter(liters);
    }

    public toMeters(length: number): number {
        return this.current.toMeters(length);
    }

    public fromMeters(meters: number): number {
        return this.current.fromMeters(meters);
    }

    public toBar(length: number): number {
        return this.current.toBar(length);
    }

    public fromBar(meters: number): number {
        return this.current.fromBar(meters);
    }

    public fromTankLiters(liters: number): number {
        return this.current.fromTankLiters(liters);
    }

    public toTankLiters(cuftVolume: number): number {
        return this.current.toTankLiters(cuftVolume);
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
    diverRmv: [number, number];
    diverRmvLabel: string;
    ppO2: [number, number];
    depth: [number, number];
    depthLabel: string;
    narcoticDepth: [number, number];
    narcoticDepthLabel: string;
    lastStopDepth: [number, number];
    lastStopDepthLabel: string;
    duration: [number, number];
    durationLabel: string;
    altitude: [number, number];
    altitudeLabel: string;
    speed: [number, number];
    speedLabel: string;

    decoStopDistance: number;
    minimumAutoStopDepth: number;
    lastStopDepthDefault: number;
}

const perMinute = '/min';
const toLabel = (range: [number, number], unit: string): string => `${range[0]} - ${range[1]} ${unit}`;

class MetricRanges implements RangeConstants {
    // Forms
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
    public diverRmv: [number, number] = [5, 90];
    public diverRmvLabel: string = toLabel(this.diverRmv, this.units.volumeShortcut + perMinute);
    public ppO2: [number, number] = [0.21, 3];
    public depth: [number, number] = [1,350];
    public depthLabel: string = toLabel(this.depth, this.units.lengthShortcut);
    public narcoticDepth: [number, number] = [1,100];
    public narcoticDepthLabel: string = toLabel(this.narcoticDepth, this.units.lengthShortcut);
    public lastStopDepth: [number, number] = [3,6];
    public lastStopDepthLabel: string = toLabel(this.lastStopDepth, this.units.lengthShortcut);
    public duration: [number, number] = [1,1440];
    public durationLabel: string = toLabel(this.duration, 'min');
    public altitude: [number, number] = [0,5000];
    public altitudeLabel: string = toLabel(this.altitude, this.units.altitudeShortcut);
    public speed: [number, number] = [1,100];
    public speedLabel: string = toLabel(this.speed, this.units.lengthShortcut + perMinute);

    // Algorithm
    public decoStopDistance = 3;
    public minimumAutoStopDepth = 10;
    public lastStopDepthDefault = 3;

    constructor(private units: Units) {}
}


class ImperialRanges implements RangeConstants  {
    // Forms
    public diverRmv: [number, number] = [0.17, 3.178];
    public diverRmvLabel: string = toLabel(this.diverRmv, this.units.volumeShortcut + perMinute);
    public depth: [number, number] = [3, 1150];
    public depthLabel: string = toLabel(this.depth, this.units.lengthShortcut);
    public tankSize: [number, number] = [1, 300];
    public tankSizeLabel: string = toLabel(this.tankSize, this.units.volumeShortcut);
    public tankPressure: [number, number] = [400, 5100];
    public tankPressureLabel: string = toLabel(this.tankPressure, this.units.pressureShortcut);

    // Algorithm
    public decoStopDistance = 10;
    public minimumAutoStopDepth = 33;
    public lastStopDepthDefault = 10;

    // TODO adjust imperial ranges
    public nitroxOxygen: [number, number] = [21, 100];
    public nitroxOxygenLabel: string = toLabel(this.nitroxOxygen, '%');
    public trimixOxygen: [number, number] = [1, 100];
    public trimixOxygenLabel: string = toLabel(this.trimixOxygen, '%');
    public tankHe: [number, number] = [0, 99];
    public tankHeLabel: string = toLabel(this.tankHe, '%');


    public ppO2: [number, number] = [0.21, 3];

    public narcoticDepth: [number, number] = [1,100];
    public narcoticDepthLabel: string = toLabel(this.narcoticDepth, this.units.lengthShortcut);
    public lastStopDepth: [number, number] = [3,6];
    public lastStopDepthLabel: string = toLabel(this.lastStopDepth, this.units.lengthShortcut);
    public duration: [number, number] = [1,1440];
    public durationLabel: string = toLabel(this.duration, 'min');
    public altitude: [number, number] = [0,5000];
    public altitudeLabel: string = toLabel(this.altitude, this.units.altitudeShortcut);
    public speed: [number, number] = [1,100];
    public speedLabel: string = toLabel(this.speed, this.units.lengthShortcut + perMinute);

    constructor(private units: Units) {}
}
