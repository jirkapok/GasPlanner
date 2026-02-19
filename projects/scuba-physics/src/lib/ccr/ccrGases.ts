export enum RebreatherMode {
    ECCR = "ECCR",
    MCCR = "MCCR",
    PSCR = "PSCR"
}

export interface GasFractions {
    FO2: number;
    FHe: number;
    FN2: number;
}

export class RebreatherGasCalculator {

    private static readonly R = 8.314;
    private static readonly PaPerATA = 101325;

    static calculate(
        mode: RebreatherMode,
        depthMeters: number,
        fO2Dil: number,
        fHeDil: number,
        options?: {
            ppo2Setpoint?: number;
            o2FlowLpmAmbient?: number;
            dilFlowLpmAmbient?: number;
            metabolicO2LpmSTP?: number;
            temperatureK?: number;
        }
    ): GasFractions {

        const {
            ppo2Setpoint = 1.3,
            o2FlowLpmAmbient = 0,
            dilFlowLpmAmbient = 0,
            metabolicO2LpmSTP = 1.0,
            temperatureK = 293.15
        } = options || {};

        const pAmbATA = depthMeters / 10 + 1;
        const pAmbPa = pAmbATA * this.PaPerATA;

        switch (mode) {
            case RebreatherMode.ECCR:
                return this.calculateECCR(depthMeters, ppo2Setpoint, fO2Dil, fHeDil);

            case RebreatherMode.PSCR:
                return this.calculatePSCR_SteadyFO2(
                    fO2Dil,
                    fHeDil,
                    dilFlowLpmAmbient,
                    metabolicO2LpmSTP
                );

            case RebreatherMode.MCCR:
                return this.calculateMCCR(
                    pAmbPa,
                    fO2Dil,
                    fHeDil,
                    o2FlowLpmAmbient,
                    dilFlowLpmAmbient,
                    metabolicO2LpmSTP,
                    temperatureK
                );

            default:
                throw new Error("Unsupported rebreather mode");
        }
    }

    // =============================
    // eCCR
    // =============================
    private static calculateECCR(
        depthMeters: number,
        // range: , recommended descent = 0.7, bottom = 1.3, ascent 1.0
        // switch to bottom sp at 20 - 25 m, to ascent at first stop
        ppo2Setpoint: number,
        fO2Dil: number,
        fHeDil: number
    ): GasFractions {

        const pAmb = depthMeters / 10 + 1;
        let fO2Loop = ppo2Setpoint / pAmb;
        fO2Loop = this.clamp(fO2Loop, 0, 1);

        const fN2Dil = 1 - fO2Dil - fHeDil;
        const inertSum = fHeDil + fN2Dil;
        const remaining = 1 - fO2Loop;

        const fHeLoop = inertSum > 0 ? remaining * (fHeDil / inertSum) : 0;
        const fN2Loop = inertSum > 0 ? remaining * (fN2Dil / inertSum) : 0;

        return { FO2: fO2Loop, FHe: fHeLoop, FN2: fN2Loop };
    }

    // =============================
    // pSCR — STEADY-STATE FO2 MODEL
    // =============================
    private static calculatePSCR_InjectionRatio(
        fO2Dil: number,
        fHeDil: number,
        // range: 4-12, minimum > 1/fO2
        injectionRatio: number,
        depth: number // bar
    ): GasFractions {

        if (injectionRatio <= 0)
            throw new Error("Injection ratio must be > 0");

        const fN2Dil = 1 - fO2Dil - fHeDil;

        // Steady-state FO2
        // injectionRatio needs to be > oxygenExtraction. In case extraction = 1, injection ration needs to be > 1
        let fO2Loop = fO2Dil - (1 / injectionRatio);
        fO2Loop = this.clamp(fO2Loop, 0, 1);

        // Renormalize inert gases
        const inertLoop = 1 - fO2Loop;
        const inertDil = 1 - fO2Dil;

        const fHeLoop = inertDil > 0 ? inertLoop * (fHeDil / inertDil) : 0;
        const fN2Loop = inertDil > 0 ? inertLoop * (fN2Dil / inertDil) : 0;

        return { FO2: fO2Loop, FHe: fHeLoop, FN2: fN2Loop }; // TODO normalize to bar
    }


    // TODO do we even need this if o2Flow = metabolic?
    // Because it would mean that pO2 didnt change = diluent O2
    /**
     * Simplified steady-state mCCR loop PO2.
     * The loop PO₂ settles where O₂ addition equals metabolic use.
     *
     * depthM — depth in meters
     * FO2_dil — diluent O2 fraction (0–1)
     * o2Flow — manual O2 addition rate (L/min, surface equivalent)
     * metabolic — diver O2 consumption (L/min, surface equivalent)
     */
    mccrLoopPO2(
        depthM: number,
        FO2_dil: number,
        o2Flow: number,
        metabolic: number = 1.0
    ): number {

        const P = 1 + depthM / 10; // ambient pressure (bar)

        // Diluent contribution
        const diluentPO2 = P * FO2_dil;

        // Excess O2 accumulation (compressed in loop)
        const excess = Math.max(0, o2Flow - metabolic) / P;

        return diluentPO2 + excess;
    }

    private static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
