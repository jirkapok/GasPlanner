export interface Units {
    name: string;
    lengthShortcut: string;
    pressureShortcut: string;
    volumeShortcut: string;
    toMeters(length: number): number;
    fromMeters(meters: number): number;
    toBar(pressure: number): number;
    fromBar(bars: number): number;
    toLiter(volume: number): number;
    fromLiter(liters: number): number;
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
}

/**
 * length: meter/foot
 * https://en.wikipedia.org/wiki/Foot_(unit)
 * 1 foot = 0.3048 meter - derived international foot
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
}
