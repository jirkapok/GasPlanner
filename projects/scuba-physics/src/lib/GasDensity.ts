export class GasDensity {
    // Constants as g/l at ATA
    private helium = 0.179;
    private nitrogen = 1.251;
    private oxygen = 1.428;

    /**
     * Calculates approximate gas density of oxygen, nitrogen, helium mixture at 1 ATA.
     * https://www.facebook.com/watch/?v=400481725415718
     * https://dan.org/alert-diver/article/performance-under-pressure/
     * @param fO2 fraction of oxygen in range 0-1
     * @param fHe fraction of helium in range 0-1
     * @returns Calculated density in g/l
     */
    public forGas(fO2: number, fHe: number): number {
        // TODO use the Gas class for content calculation instead
        const fN2 = 1 - fO2 - fHe;
        const densityfN2 = this.nitrogen * fN2;
        const densityO2 = this.oxygen * fO2;
        const densityHe = this.helium * fHe;
        return densityfN2 + densityO2 + densityHe;
    }
}
