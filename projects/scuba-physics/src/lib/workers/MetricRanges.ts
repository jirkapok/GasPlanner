import { MetricUnits, Units } from '../physics/units';

/** All numeric values are in current units of the provider, e.g. not normalized to metrics only. */
export interface RangeConstants {
    units: Units;
    tankSize: [number, number];
    tankSizeLabel: string;
    tankPressure: [number, number];
    tankPressureLabel: string;
    consumed: [number, number];
    consumedLabel: string;
    nitroxOxygen: [number, number];
    nitroxOxygenLabel: string;
    trimixOxygen: [number, number];
    trimixOxygenLabel: string;
    tankHe: [number, number];
    tankHeLabel: string;
    diverRmv: [number, number];
    diverRmvLabel: string;
    /** pSCR ratio of breathed to dumped volume, without units */
    injectionRatio: [number, number];
    injectionRatioLabel: string;
    /** Rebreather diver oxygen consumption in volume per minute */
    metabolicO2: [number, number];
    metabolicO2Label: string;
    /** mCCR oxygen partial pressure held by the diver in bars */
    setpoint: [number, number];
    setpointLabel: string;
    /** mCCR needle valve oxygen flow in volume per minute */
    o2Flow: [number, number];
    o2FlowLabel: string;
    /** Rebreather breathing loop volume */
    loopVolume: [number, number];
    loopVolumeLabel: string;
    /** eCCR depth to switch from descent to bottom setpoint */
    setpointSwitchDepth: [number, number];
    setpointSwitchDepthLabel: string;
    ppO2: [number, number];
    /** Number of decimal places to round rmv values */
    rmvRounding: number;
    depth: [number, number];
    depthLabel: string;
    maxDensity: [number, number];
    maxDensityLabel: string;
    densityRounding: number;
    narcoticDepth: [number, number];
    narcoticDepthLabel: string;
    lastStopDepth: [number, number];
    lastStopDepthLabel: string;
    /** Dive duration only, the other durations like gas switch, solve problem are defined directly in the UI */
    duration: [number, number];
    durationLabel: string;
    altitude: [number, number];
    altitudeLevels: [number, number, number, number];
    altitudeLabel: string;
    altitudePressure: [number, number];
    speed: [number, number];
    speedLabel: string;
    money: [number, number];
    moneyLabel: string;
    decoStopDistance: [number, number];
    decoStopDistanceLabel: string;
}

export const perMinute = '/min';
export const toLabel = (range: [number, number], unit: string): string => `${range[0]} - ${range[1]} ${unit}`;

/** Validation ranges of the application in metric units, shared with the MCP server */
export class MetricRanges implements RangeConstants {
    public readonly units = new MetricUnits();
    public readonly altitude: [number, number] = [0, 5000];
    public readonly altitudeLevels: [number, number, number, number] = [0, 300, 800, 1500];
    public readonly altitudeLabel: string = toLabel(this.altitude, this.units.altitudeShortcut);
    public readonly altitudePressure: [number, number] = [0.7, 1.2];
    public readonly consumed: [number, number] = [0, 350];
    public readonly consumedLabel: string = toLabel(this.consumed, this.units.pressureShortcut);
    public readonly depth: [number, number] = [0, 350];
    public readonly depthLabel: string = toLabel(this.depth, this.units.lengthShortcut);
    public readonly diverRmv: [number, number] = [5, 90];
    public readonly diverRmvLabel: string = toLabel(this.diverRmv, this.units.volumeShortcut + perMinute);
    public readonly injectionRatio: [number, number] = [4, 20];
    public readonly injectionRatioLabel: string = toLabel(this.injectionRatio, '');
    public readonly metabolicO2: [number, number] = [0.5, 4];
    public readonly metabolicO2Label: string = toLabel(this.metabolicO2, this.units.volumeShortcut + perMinute);
    public readonly setpoint: [number, number] = [0.4, 1.6];
    public readonly setpointLabel: string = toLabel(this.setpoint, 'bar');
    public readonly o2Flow: [number, number] = [0.3, 3];
    public readonly o2FlowLabel: string = toLabel(this.o2Flow, this.units.volumeShortcut + perMinute);
    public readonly loopVolume: [number, number] = [2, 10];
    public readonly loopVolumeLabel: string = toLabel(this.loopVolume, this.units.volumeShortcut);
    public readonly setpointSwitchDepth: [number, number] = [3, 30];
    public readonly setpointSwitchDepthLabel: string = toLabel(this.setpointSwitchDepth, this.units.lengthShortcut);
    public readonly duration: [number, number] = [1, 1440];
    public readonly durationLabel: string = toLabel(this.duration, 'min');
    public readonly maxDensity: [number, number] = [1, 10];
    public readonly maxDensityLabel: string = toLabel(this.maxDensity, this.units.densityShortcut);
    public readonly densityRounding: number = 1;
    public readonly narcoticDepth: [number, number] = [1, 100];
    public readonly narcoticDepthLabel: string = toLabel(this.narcoticDepth, this.units.lengthShortcut);
    public readonly nitroxOxygen: [number, number] = [21, 100];
    public readonly nitroxOxygenLabel: string = toLabel(this.nitroxOxygen, '%');
    public readonly lastStopDepth: [number, number] = [3, 6];
    public readonly lastStopDepthLabel: string = toLabel(this.lastStopDepth, this.units.lengthShortcut);
    public readonly decoStopDistance: [number, number] = [1, 10];
    public readonly decoStopDistanceLabel: string = toLabel(this.decoStopDistance, this.units.lengthShortcut);
    public readonly ppO2: [number, number] = [0.21, 3];
    public readonly rmvRounding = 2;
    public readonly tankHe: [number, number] = [0, 99];
    public readonly tankHeLabel: string = toLabel(this.tankHe, '%');
    public readonly tankPressure: [number, number] = [1, 350];
    public readonly tankPressureLabel: string = toLabel(this.tankPressure, this.units.pressureShortcut);
    public readonly tankSize: [number, number] = [1, 50];
    public readonly tankSizeLabel: string = toLabel(this.tankSize, this.units.volumeShortcut);
    public readonly trimixOxygen: [number, number] = [1, 100];
    public readonly trimixOxygenLabel: string = toLabel(this.trimixOxygen, '%');
    public readonly speed: [number, number] = [0.1, 100];
    public readonly speedLabel: string = toLabel(this.speed, this.units.lengthShortcut + perMinute);
    public readonly money: [number, number] = [0, 1000000]; // allow zero - may be for free
    public readonly moneyLabel: string = toLabel(this.money, '');

    constructor() { }
}
