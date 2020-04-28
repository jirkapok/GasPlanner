import { Density, Gravity, AltitudePressure, PressureConverter } from './pressure-converter';

export class DepthConverter {
  public static forSaltWater(): DepthConverter {
    return new DepthConverter(Density.salt);
  }

  public static forFreshWater(): DepthConverter {
    return new DepthConverter(Density.fresh);
  }

  private constructor(private density: number) { }

  /**
   * Calculates the absolute pressure (in bars) for 1 cubic meter of water for the given depth (meters).
   *
   * @param depth - The depth in meters below the surface for 1 cubic meter volume of water.
   * @returns The absolute pressure (in bars) for the given depth (in meters) of 1 cubic meter volume of water below the surface.
   */
  public toBar(depth: number): number {
    const weightDensity = this.density * Gravity.current;
    return PressureConverter.pascalToBar((depth * weightDensity)) + AltitudePressure.current;
  }

  /**
   * Calculates the depth (in meters) for the given atmosphere (bar).
   *
   * @param bars - The number of atmospheric pressure (in bars) to convert.
   * @returns The depth (in meters) for the given number of atmospheres.
   */
  public fromBar(bars: number): number {
    if (bars < AltitudePressure.current) {
        throw new Error('Lower pressure than altitude isn`t convertible to depth.');
    }

    const weightDensity = this.density * Gravity.current;
    const pressure = PressureConverter.barToPascal(bars - AltitudePressure.current);
    return pressure / weightDensity;
  }
}
