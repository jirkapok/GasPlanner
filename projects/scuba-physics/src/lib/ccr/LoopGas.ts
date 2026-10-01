import { Gas } from '../gases/Gases';
import { Rebreathers } from './Rebreathers';

/**
 * Calculates content of the rebreather breathing loop.
 * Fractions are relative to ambient pressure, inert gases keep the diluent (supply) helium/nitrogen ratio.
 */
export class LoopGas {
    /**
     * Loop held at constant oxygen partial pressure (eCCR, mCCR).
     * The ppO2 can't be lower than diluent ppO2 (diluent flush) and higher than ambient pressure (pure oxygen).
     * @param ambientPressure absolute pressure in bars
     * @param diluent diluent gas
     * @param setPoint required oxygen partial pressure in bars
     */
    public static constantPpO2(ambientPressure: number, diluent: Gas, setPoint: number): Gas {
        const diluentPpO2 = diluent.fO2 * ambientPressure;
        const ppO2 = Math.min(Math.max(setPoint, diluentPpO2), ambientPressure);
        const fO2 = ppO2 / ambientPressure;
        return LoopGas.withInertRatio(fO2, diluent);
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
