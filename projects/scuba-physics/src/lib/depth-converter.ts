import { Density, Gravity, AltitudePressure, PressureConverter } from './pressure-converter';

export class DepthConverter {
  private _surfacePressure: number;

  public static forSaltWater(): DepthConverter {
    return new DepthConverter(Density.salt, 0);
  }

  public static forFreshWater(): DepthConverter {
    return new DepthConverter(Density.fresh, 0);
  }

  public get surfacePressure(): number {
    return this._surfacePressure;
  }

  private constructor(private density: number, altitude: number) {
    const pressureInPascals = AltitudePressure.atAltitude(altitude);
    this._surfacePressure = PressureConverter.pascalToBar(pressureInPascals);
   }

  /**
   * Calculates the absolute pressure (in bars) for 1 cubic meter of water for the given depth (meters).
   *
   * @param depth - The depth in meters below the surface for 1 cubic meter volume of water.
   * @returns The absolute pressure (in bars) for the given depth (in meters) of 1 cubic meter volume of water below the surface.
   */
  public toBar(depth: number): number {
    const weightDensity = this.density * Gravity.standard;
    return PressureConverter.pascalToBar((depth * weightDensity)) + this._surfacePressure;
  }

  /**
   * Calculates the depth (in meters) for the given atmosphere (bar).
   *
   * @param bars - The number of atmospheric pressure (in bars) to convert.
   * @returns The depth (in meters) for the given number of atmospheres.
   */
  public fromBar(bars: number): number {
    if (bars < this._surfacePressure) {
        throw new Error('Lower pressure than altitude isn`t convertible to depth.');
    }

    const weightDensity = this.density * Gravity.standard;
    const pressure = PressureConverter.barToPascal(bars - this._surfacePressure);
    return pressure / weightDensity;
  }
}
