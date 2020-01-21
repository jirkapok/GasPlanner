export class Density {
  /**
    * Calculates the liquid density of the mass for the given volume.
    * 
    * @param weight - The weight (in kilograms) of the given mass.
    * @param volume - The volume of the given mass in (cubic meters m3).
    * @returns Density of the mass
    */
  public static density(weight: number, volume: number): number {
    return weight / volume;
  };

  /**
   * 1000kg / m3 at 0C / 32F (standard conditions for measurements).
   */
  public static readonly fresh: number = Density.density(1000, 1);

  /**
   * 1030kg / m3 at 0C / 32F (standard conditions for measurements).
   */
  public static readonly salt: number = Density.density(1030, 1);

  /**
   * 13595.1 kg / m3 at 0C / 32F (standard conditions)).
   */
  public static readonly mercury: number = Density.density(13595.1, 1);
};

export class Gravity {
  /**
   * current gravity sample rates in meters per second per second (m/s2)
   */
  public static readonly earth: number = 9.80665;
  public static readonly current: number = Gravity.earth;
}

export class AltitudePressure {
  public static readonly seaLevel: number = 1;
  public static readonly current: number = AltitudePressure.seaLevel;
}

/**
 *  current surface pressure measured in bar
 */
export class SurfacePressure {
  public static readonly earth: number = 1;
  public static readonly current: number = SurfacePressure.earth;
}

export class VapourPressure {
      public static readonly tempRange_1_100: number[] = [8.07131,1730.63,233.426];
      public static readonly tempRange_99_374: number[] = [8.14019,1810.94,244,485];
}

export class PressureConverterService {
  private static readonly coefficient: number = 100000;

  /**
   * Calculates the pascal to bar derived unit. 100000 pascals = 1 bar.
   * 
   * @param pascals - The pascal SI derived unit.
   * @returns Bar derived unit of pressure from pascal.
   */
  public static pascalToBar(pascals: number): number {
    return pascals / (SurfacePressure.current * PressureConverterService.coefficient);
  };

  /**
   * Calculates the bar to pascal derived unit. 100000 pascals = 1 bar.
   * 
   * @param bars - The bar derived unit.
   * @returns >Pascal derived unit of pressure from bars.
   */
  public static barToPascal(bars: number): number {
    if (!bars) {
      bars = 1;
    }

    return bars * (SurfacePressure.current * PressureConverterService.coefficient);
  };
}