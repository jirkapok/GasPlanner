export interface GasConsumptionResult {
    depthM: number;
    pressureBar: number;
    o2SurfaceLpm: number;     // Surface-equivalent L/min
    o2AtDepthLpm: number;     // Compressed volume in loop at depth
    totalGasSurfaceLpm?: number; // For pSCR: total diluent/premix
}

/**
 * Calculates O2 consumed (and injected) by an eCCR at depth
 *
 * depthM — depth in meters
 * metabolic — O2 consumption (L/min surface equivalent)
 * lossFraction — fractional losses (0–1), default 0.1
 */
export function eccrO2Consumption(
    depthM: number,
    metabolic: number = 1.0,
    lossFraction: number = 0.1
) {
    const P = 1 + depthM / 10;

    // Surface-equivalent oxygen usage (what the cylinder supplies)
    const o2SLM = metabolic * (1 + lossFraction);

    // Actual volumetric flow at depth
    const o2AtDepth = o2SLM / P;

    // Typically 0.8–1.5 L/min
    return {
        pressureBar: P,
        o2SurfaceLpm: o2SLM,
        o2AtDepthLpm: o2AtDepth
    };
}

/**
 * mCCR O2 consumption
 * @param depthM — depth in meters
 * @param FO2_dil — diluent O2 fraction
 * @param o2Flow — manual needle valve O2 flow (L/min surface)
 * @param metabolic — metabolic O2 consumption (L/min SLM)
 */
export function mCCRConsumption(
    depthM: number,
    FO2_dil: number = 0.21,
    o2Flow: number = 1.2,
    metabolic: number = 1.0
): GasConsumptionResult {
    const P = 1 + depthM / 10;

    const o2Surface = o2Flow;                // Flow injected via needle valve
    const o2AtDepth = o2Surface / P;        // Compressed at depth

    return { depthM, pressureBar: P, o2SurfaceLpm: o2Surface, o2AtDepthLpm: o2AtDepth };
}

/**
 * pSCR Gas consumption
 * @param depthM — depth in meters
 * @param FO2_supply — supply gas O2 fraction
 * @param injectionRatio — fraction of RMV replaced by fresh gas (0–1)
 * @param RMV — respiratory minute volume (L/min)
 * @param metabolic — metabolic O2 consumption (L/min)
 */
export function pSCRConsumption(
    depthM: number,
    FO2_supply: number = 0.32,
    injectionRatio: number = 0.1,
    RMV: number = 20,
    metabolic: number = 1.0
): GasConsumptionResult {
    const P = 1 + depthM / 10;

    const inflow = injectionRatio * RMV;       // Surface-equivalent fresh gas added
    const o2Surface = FO2_supply * inflow;     // Oxygen in fresh gas
    const totalGasSurface = inflow;            // Total premix added

    const o2AtDepth = o2Surface / P;           // Compressed at depth

    return { depthM, pressureBar: P, o2SurfaceLpm: o2Surface, o2AtDepthLpm: o2AtDepth, totalGasSurfaceLpm: totalGasSurface };
}
