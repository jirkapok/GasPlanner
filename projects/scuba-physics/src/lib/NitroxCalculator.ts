import { DepthConverter } from "./depth-converter";

export class NitroxCalculator {
    
  /**
   * Calculates best mix of nitrox gas for given depth.
   * 
   * @param pO2 - Partial pressure constant.
   * @param depth - Current depth in meters.
   * @returns Percents of oxygen fraction in required gas.
   */
  public static bestMix(pO2: number, depth: number): number {
    const bar = DepthConverter.toBar(depth, true);
    const result = pO2 * 100 / bar;
    return Math.floor(result * 100) / 100;
  }

  /**
   * Calculates equivalent air depth for given nitrox gas mix.
   * 
   * @param fO2 - Percents of Oxygen fraction in gas.
   * @param depth - Current depth in meters.
   * @returns Depth in meters.
   */
  public static ead(fO2: number, depth: number): number {
    const fN2 = 1 - fO2 / 100;
    const result = fN2 * (depth + 10) / 0.79 - 10;
    return Math.ceil(result * 100) / 100;
  }

  /**
   * Calculates Maximum operation depth for given mix.
   * 
   * @param pO2 - Partial pressure constant.
   * @param fO2 - Percents of Oxygen fraction in gas.
   * @returns Depth in meters. 
   */
  public static mod(pO2: number, fO2: number): number {
    const bar = pO2 * 100 / fO2;
    const result = DepthConverter.fromBar(bar, true);
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
    const result = fO2 * bar / 100;
    return Math.ceil(result * 100) / 100;
  }
}