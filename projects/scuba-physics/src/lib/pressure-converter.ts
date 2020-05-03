export class Density {
  /**
   * 1000kg / m3 at 0C / 32F (standard conditions for measurements).
   */
  public static readonly fresh: number = Density.density(1000, 1);

  /**
   * 1030kg / m3 at 0C / 32F (standard conditions for measurements).
   */
  public static readonly salt: number = Density.density(1030, 1);

  /**
    * Calculates the liquid density of the mass for the given volume.
    *
    * @param weight - The weight (in kilograms) of the given mass.
    * @param volume - The volume of the given mass in (cubic meters m3).
    * @returns Density of the mass
    */
  public static density(weight: number, volume: number): number {
    return weight / volume;
  }

}

/**
 * Using constant, since still 3000 meters above the see the gravity is 9.79742 m/s2
 * https://en.wikipedia.org/wiki/Gravity_of_Earth#Mathematical_models
 */
export class Gravity {
  /**
   * Standard gravity sample rates in meters per second per second (m/s2)
   */
  public static readonly standard: number = 9.80665;
}

/**
 * https://en.wikipedia.org/wiki/Pressure#Units
 */
export class PressureConverter {
  private static readonly coefficient: number = 100000;

  /**
   * Calculates the pascal to bar derived unit. 100000 pascals = 1 bar.
   *
   * @param pascals - The pascal SI derived unit.
   * @returns Bar derived unit of pressure from pascal.
   */
  public static pascalToBar(pascals: number): number {
    return pascals / PressureConverter.coefficient;
  }

  /**
   * Calculates the bar to pascal derived unit. 100000 pascals = 1 bar.
   *
   * @param bars - The bar derived unit.
   * @returns >Pascal derived unit of pressure from bars.
   */
  public static barToPascal(bars: number): number {
    return bars * PressureConverter.coefficient;
  }
}

/**
 * https://en.wikipedia.org/wiki/Barometric_formula#Derivation
 */
export class AltitudePressure {
  public static readonly standard: number = 1.01325;
  public static readonly seaLevel: number = AltitudePressure.standard;
  public static readonly current: number = AltitudePressure.seaLevel;

  public static atAltitude(altitude: number): number {
    // https://en.wikipedia.org/wiki/Barometric_formula
    // https://en.wikipedia.org/wiki/International_Standard_Atmosphere
    const gasConstant = 8.31432; // J/(mol·K) for air
    const temperature = 288.15; // kelvin = 15°C
    const lapsRate = -0.0065;  // kelvin/meter
    const molarMass = 0.0289644; // kg/mol

    const standardPressure = PressureConverter.barToPascal(this.standard);
    const gravity = Gravity.standard;
    const base = temperature / (temperature + lapsRate * altitude);
    const exponent = (gravity * molarMass) / (gasConstant * lapsRate);
    return standardPressure * Math.pow(base, exponent);
  }
}
