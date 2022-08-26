/** All values are in respective units */
export interface Units {
    name: string;
    lengthShortcut: string;
    pressureShortcut: string;
    volumeShortcut: string;
    altitudeShortcut: string;
    /** Depth at which last speed change occurs */
    lastSpeedLevel: number;
    /** Depth at which we decide if safety stop is required */
    autoStopLevel: number;
    /** Distance defining stops during auto calculated ascent */
    stopsDistance: number;
    toMeters(length: number): number;
    fromMeters(meters: number): number;
    toBar(pressure: number): number;
    fromBar(bars: number): number;
    toLiter(volume: number): number;
    fromLiter(liters: number): number;
    fromTankLiters(liters: number): number;
    toTankLiters(cuftVolume: number): number;
}

/**
 * 1:1 adapter transforming metric units to metric units. This is a dummy adapter for metric units usage,
 * which we don't convert, because all calculations are done in metric units by default.
 */
export class MetricUnits implements Units {
    public get name(): string {
        return 'Metric';
    }

    public get lengthShortcut(): string{
        return 'm';
    }

    public get pressureShortcut(): string {
        return 'bar';
    }

    public get volumeShortcut(): string{
        return 'l';
    }

    public get altitudeShortcut(): string{
        return 'm.a.s.l';
    }

    public get lastSpeedLevel(): number {
        return 6;
    }

    public get autoStopLevel(): number {
        return 10;
    }

    public get stopsDistance(): number {
        return 3;
    }

    public toMeters(length: number): number {
        return length;
    }

    public fromMeters(meters: number): number {
        return meters;
    }

    public toBar(pressure: number): number {
        return pressure;
    }

    public fromBar(bars: number): number {
        return bars;
    }

    public toLiter(volume: number): number {
        return volume;
    }

    public fromLiter(liters: number): number {
        return liters;
    }

    public fromTankLiters(liters: number): number {
        return liters;
    }

    public toTankLiters(cuftVolume: number): number {
        return cuftVolume;
    }
}

/**
 * length: meter/foot
 * https://en.wikipedia.org/wiki/Foot_(unit)
 * 1 foot = 0.3048 meter - derived international foot
 * Altitude m.a.s.l. to f.a.s.l. is only conversion from meters to feet
 *
 * volume: cubic foot (cft)/liter
 * https://en.wikipedia.org/wiki/Standard_cubic_foot
 * https://en.wikipedia.org/wiki/Cubic_foot
 * 1 cft = 28.316846592 liter
 *
 * pressure: bar/psi
 * https://en.wikipedia.org/wiki/Pound_per_square_inch
 * 1 bar = 14.503773773022 psi
*/
export class ImperialUnits implements Units {
    private static readonly psiRate = 14.503773773022;
    private static readonly cftRate = 28.316846592;
    private static readonly footRate = 0.3048;
    // TODO make working pressure configurable
    /** In bars corresponding to 3000 psi */
    private readonly workingPressure = 206.84;

    public get name(): string{
        return 'Imperial';
    }

    public get lengthShortcut(): string{
        return 'ft';
    }

    public get pressureShortcut(): string {
        return 'psi';
    }

    public get volumeShortcut(): string{
        return 'cuft';
    }

    public get altitudeShortcut(): string{
        return 'ft.a.s.l';
    }

    public get lastSpeedLevel(): number {
        return 20;
    }

    public get autoStopLevel(): number {
        return 33;
    }

    public get stopsDistance(): number {
        return 10;
    }

    public toMeters(length: number): number {
        return length * ImperialUnits.footRate;
    }

    public fromMeters(meters: number): number {
        return meters / ImperialUnits.footRate;
    }

    public toBar(pressure: number): number {
        return pressure / ImperialUnits.psiRate;
    }

    public fromBar(bars: number): number {
        return bars * ImperialUnits.psiRate;
    }

    public toLiter(volume: number): number {
        return volume * ImperialUnits.cftRate;
    }

    public fromLiter(liters: number): number {
        return liters / ImperialUnits.cftRate;
    }

    public fromTankLiters(liters: number): number {
        // return this.units.fromLiter(this.tank.size);
        const relativeVolume = this.fromLiter(liters);
        const absoluteVolume = relativeVolume * this.workingPressure;
        return absoluteVolume;
    }

    public toTankLiters(cuftVolume: number): number {
        // S80 => 11.1 L  => 80 cuft at 3000 psi
        // 80 cuft -> 2265.3 L, 3000 psi -> 206.84 b => 2265.3/206.84 = 10.95 L
        const absoluteLiters = this.toLiter(cuftVolume);
        const newLiters = absoluteLiters / this.workingPressure;
        return newLiters;
    }
}
