import { Density, Gravity, AltitudePressure, PressureConverter } from './pressure-converter';

export class DepthConverter {
  /**
   * Calculates the absolute pressure (in bars) for 1 cubic meter of water for the given depth (meters).
   * 
   * @param depth - The depth in meters below the surface for 1 cubic meter volume of water.
   * @param isFreshWater - True to calculate against the weight density of fresh water versus salt.
   * @returns The absolute pressure (in bars) for the given depth (in meters) of 1 cubic meter volume of water below the surface.
   */
  public static toBar(depth: number, isFreshWater: boolean): number {
    const liquidDensity = DepthConverter.densityByWater(isFreshWater);
    const weightDensity = liquidDensity * Gravity.current;
    return PressureConverter.pascalToBar((depth * weightDensity)) + AltitudePressure.current;
  }

  /**
   * Calculates the depth (in meters) for the given atmosphere (bar).
   * 
   * @param bars - The number of atmospheric pressure (in bars) to convert.
   * @param isFreshWater - True to calculate against the weight density of fresh water versus salt.
   * @returns The depth (in meters) for the given number of atmospheres.
   */
  public static fromBar(bars: number, isFreshWater: boolean): number {
    if(bars < AltitudePressure.current)
        throw 'Lower pressure than altidude isn`t convertible to depth.';

    const liquidDensity = DepthConverter.densityByWater(isFreshWater);
    const weightDensity = liquidDensity * Gravity.current;
    const pressure = PressureConverter.barToPascal(bars - AltitudePressure.current);
    return pressure / weightDensity;
  }

  private static densityByWater(isFreshWater: boolean): number {
    if (isFreshWater) {
      return Density.fresh;
    }

    return Density.salt;
  }
}
