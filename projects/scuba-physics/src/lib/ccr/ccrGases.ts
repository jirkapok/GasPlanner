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

    private static readonly R = 8.314;        // J/(mol·K)
    private static readonly PaPerATA = 101325;

    static calculate(
        mode: RebreatherMode,
        depthMeters: number,
        fO2Dil: number,
        fHeDil: number,
        options?: {
            ppo2Setpoint?: number;       // eCCR
            o2FlowLpmAmbient?: number;   // mCCR
            dilFlowLpmAmbient?: number;  // mCCR & pSCR
            metabolicO2LpmSTP?: number;  // mCCR & pSCR
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
                return this.calculatePSCR(
                    pAmbPa,
                    fO2Dil,
                    fHeDil,
                    dilFlowLpmAmbient,
                    metabolicO2LpmSTP,
                    temperatureK
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
    // pSCR
    // =============================
    private static calculatePSCR(
        pAmbPa: number,
        fO2Dil: number,
        fHeDil: number,
        dilFlowLpmAmbient: number,
        metabolicO2LpmSTP: number,
        temperatureK: number
    ): GasFractions {

        const fN2Dil = 1 - fO2Dil - fHeDil;

        const flowM3sAmb = (dilFlowLpmAmbient / 1000) / 60;
        const molIn = (pAmbPa * flowM3sAmb) / (this.R * temperatureK);

        const flowM3sO2_STP = (metabolicO2LpmSTP / 1000) / 60;
        const molO2 = (this.PaPerATA * flowM3sO2_STP) / (this.R * temperatureK);

        const gamma = molO2 / molIn;
        if (gamma >= 1) {
            throw new Error("Metabolic O2 demand exceeds supply");
        }

        const fO2Loop = (fO2Dil - gamma) / (1 - gamma);
        const fHeLoop = fHeDil / (1 - gamma);
        const fN2Loop = fN2Dil / (1 - gamma);

        return {
            FO2: this.clamp(fO2Loop, 0, 1),
            FHe: this.clamp(fHeLoop, 0, 1),
            FN2: this.clamp(fN2Loop, 0, 1)
        };
    }

    // =============================
    // mCCR
    // =============================
    private static calculateMCCR(
        pAmbPa: number,
        fO2Dil: number,
        fHeDil: number,
        o2FlowLpmAmbient: number,
        dilFlowLpmAmbient: number,
        metabolicO2LpmSTP: number,
        temperatureK: number
    ): GasFractions {

        const fN2Dil = 1 - fO2Dil - fHeDil;

        const o2FlowM3s = (o2FlowLpmAmbient / 1000) / 60;
        const dilFlowM3s = (dilFlowLpmAmbient / 1000) / 60;

        const molInTotal =
            (pAmbPa * (o2FlowM3s + dilFlowM3s)) / (this.R * temperatureK);

        const flowM3sO2_STP = (metabolicO2LpmSTP / 1000) / 60;
        const molO2 = (this.PaPerATA * flowM3sO2_STP) / (this.R * temperatureK);

        const gamma = molO2 / molInTotal;
        if (gamma >= 1) {
            throw new Error("Metabolic O2 demand exceeds supply");
        }

        const fO2Inflow =
            (o2FlowM3s + dilFlowM3s * fO2Dil) /
            (o2FlowM3s + dilFlowM3s);

        const fO2Loop = (fO2Inflow - gamma) / (1 - gamma);

        const inertTotalDil = 1 - fO2Dil;
        const fHeLoop = (fHeDil / inertTotalDil) * (1 - fO2Loop);
        const fN2Loop = (fN2Dil / inertTotalDil) * (1 - fO2Loop);

        return {
            FO2: this.clamp(fO2Loop, 0, 1),
            FHe: this.clamp(fHeLoop, 0, 1),
            FN2: this.clamp(fN2Loop, 0, 1)
        };
    }

    private static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
