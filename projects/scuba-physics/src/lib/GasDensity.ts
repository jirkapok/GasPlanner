import { Gas, StandardGases } from './Gases';
import { Segment } from './Segments';
import { DepthConverter } from './depth-converter';

export class HighestDensity {
    constructor(
        public gas: Gas,
        /** meters */
        public depth: number,
        /** gram/liter */
        public density: number
    ) { }

    public static createDefault(): HighestDensity {
        return new HighestDensity(StandardGases.air, 0, 0);
    }

    public applyHigher(gas: Gas, depth: number, density: number): void {
        if (density > this.density) {
            this.gas = gas;
            this.density = density;
            this.depth = depth;
        }
    }
}

/**
 * Calculates approximate gas density of oxygen, nitrogen, helium mixture at 1 ATA.
 * https://www.facebook.com/watch/?v=400481725415718
 * https://dan.org/alert-diver/article/performance-under-pressure/
 */
export class GasDensity {
    // Constants as g/l at 1 ATA
    private helium = 0.179;
    private nitrogen = 1.251;
    private oxygen = 1.428;

    /** Calculates approximate gas density of the mixture at 1 ATA. */
    public forGas(gas: Gas): number {
        return this.forContent(gas.fO2, gas.fHe);
    }

    /**
     * Calculates approximate gas density of oxygen, nitrogen, helium mixture at 1 ATA.
     * @param fO2 fraction of oxygen in range 0-1
     * @param fHe fraction of helium in range 0-1
     * @returns Calculated density in g/l
     */
    public forContent(fO2: number, fHe: number): number {
        const fN2 = 1 - fO2 - fHe;
        const densityfN2 = this.nitrogen * fN2;
        const densityO2 = this.oxygen * fO2;
        const densityHe = this.helium * fHe;
        return densityfN2 + densityO2 + densityHe;
    }
}

/** Calculates approximate gas density of oxygen, nitrogen, helium mixture at different depths. */
export class DensityAtDepth {
    private density = new GasDensity();

    constructor(private depthConverter: DepthConverter) { }

    /**
     * Finds highest density of all profile segments.
     * @param profile not null collection of segments representing expected profile
     * @returns Highest density found
     */
    public forProfile(profile: Segment[]): HighestDensity {
        const result = HighestDensity.createDefault();

        profile.forEach(s => {
            const gas = s.gas;
            const ataDensity = this.density.forGas(gas);
            this.applyHigher(result, gas, s.startDepth, ataDensity);
            this.applyHigher(result, gas, s.endDepth, ataDensity);
        });

        return result;
    }

    /** One depth level density for selected gas mix
     * @param depth in meters
     * @returns Gas density at selected depth
     */
    public atDepth(gas: Gas, depth: number): number {
        const ataDensity = this.density.forGas(gas);
        const density = this.fromAtaDensity(ataDensity, depth);
        return density;
    }

    private applyHigher(result: HighestDensity, gas: Gas, depth: number, ataDensity: number): void {
        const density = this.fromAtaDensity(ataDensity, depth);
        result.applyHigher(gas, depth, density);
    }

    private fromAtaDensity(ataDensity: number, depth: number): number {
        const depthPressure = this.depthConverter.toBar(depth);
        const density = ataDensity * depthPressure;
        return density;
    }
}
