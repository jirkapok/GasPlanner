import { Gas } from '../gases/Gases';
import { Rebreathers } from './Rebreathers';
import { LungPressure } from '../physics/pressure-converter';

/**
 * Calculates content of the rebreather breathing loop.
 * Inert gases keep the diluent (supply) helium/nitrogen ratio.
 */
export class LoopGas {
    /**
     * Loop held at constant oxygen partial pressure (eCCR, mCCR).
     * The setpoint is held in the breathed dry gas (without water vapour), the rest of the dry gas is inert gas,
     * the same way as in Subsurface. So the returned fractions are relative to the dry gas pressure.
     * @param ambientPressure absolute pressure in bars
     * @param diluent diluent gas
     * @param setPoint required oxygen partial pressure in bars
     */
    public static constantPpO2(ambientPressure: number, diluent: Gas, setPoint: number): Gas {
        const dryGasPressure = LungPressure.dryGas(ambientPressure);
        const fO2 = LoopGas.ppO2(dryGasPressure, diluent, setPoint) / dryGasPressure;
        return LoopGas.withInertRatio(fO2, diluent);
    }

    /**
     * Oxygen partial pressure held in the loop.
     * The ppO2 can't be lower than diluent ppO2 (diluent flush) and higher than the pressure (pure oxygen).
     * @param pressure absolute pressure in bars
     * @param diluent diluent gas
     * @param setPoint required oxygen partial pressure in bars
     */
    public static ppO2(pressure: number, diluent: Gas, setPoint: number): number {
        const diluentPpO2 = diluent.fO2 * pressure;
        return Math.min(Math.max(setPoint, diluentPpO2), pressure);
    }

    /**
     * Steady state of passive semi-closed rebreather.
     * fO2 = (fO2 supply * V - VO2) / (V - VO2), where V is supply rate.
     * @param ambientPressure absolute pressure in bars
     * @param supply supply gas
     * @param rmv diver respiratory minute volume in liters/minute
     * @param injectionRatio ratio of breathed to dumped volume
     * @param metabolicO2 oxygen consumed by the diver in liters/minute
     */
    public static pscrSteadyState(ambientPressure: number, supply: Gas, rmv: number, injectionRatio: number, metabolicO2: number): Gas {
        const supplyRate = Rebreathers.pscrSupplyRate(ambientPressure, rmv, injectionRatio);
        const remaining = supplyRate - metabolicO2;
        let fO2 = remaining > 0 ? (supply.fO2 * supplyRate - metabolicO2) / remaining : 0;
        fO2 = Math.min(Math.max(fO2, 0), supply.fO2);
        return LoopGas.withInertRatio(fO2, supply);
    }

    private static withInertRatio(fO2: number, source: Gas): Gas {
        const sourceInert = 1 - source.fO2;
        const inert = 1 - fO2;
        const fHe = sourceInert > 0 ? inert * source.fHe / sourceInert : 0;
        // prevent rounding errors exceeding 100 %
        return new Gas(fO2, Math.min(fHe, 1 - fO2));
    }
}
