import { DepthConverter } from "./depth-converter";
import { GasMixutures } from "./Gases";

export class NitroxCalculator {
    
  /**
   * Calculates best mix of nitrox gas for given depth.
   * 
   * @param pO2 - Partial pressure constant.
   * @param depth - Current depth in meters.
   * @returns Percents of oxygen fraction in required gas.
   */
  public static bestMix(pO2: number, depth: number): number {
    const result = GasMixutures.bestMix(pO2, depth, true) * 100 ;
    return Math.floor(result * 100) / 100;
  }

  /**
   * Calculates equivalent air depth for given nitrox gas mix.
   * 
   * @param percentO2 - Percents of Oxygen fraction in gas.
   * @param depth - Current depth in meters.
   * @returns Depth in meters.
   */
  public static ead(percentO2: number, depth: number): number {
    const fO2  = percentO2 / 100;
    const result = GasMixutures.ead(fO2, depth);
    return Math.ceil(result * 100) / 100;
  }

  /**
   * Calculates Maximum operation depth for given mix.
   * 
   * @param ppO2 - Partial pressure constant.
   * @param percentO2 - Percents of Oxygen fraction in gas.
   * @returns Depth in meters. 
   */
  public static mod(ppO2: number, percentO2: number): number {
    const fO2 = percentO2 / 100;
    const result = GasMixutures.mod(ppO2, fO2, true);
    return Math.floor(result * 100) / 100;
  }

  /**
   * Calculates partial pressure constant for given mix at depth.
   * 
   * @param fO2 - Percents of Oxygen fraction in gas.
   * @param depth - Current depth in meters.
   * @returns Constant value.
   */
  public static partialPressure(fO2: number, depth: number): number {
    const bar = DepthConverter.toBar(depth, true);
    const result = GasMixutures.partialPressure(bar, fO2) / 100;
    return Math.ceil(result * 100) / 100;
  }
}