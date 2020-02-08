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
  private static readonly tempRange_1_100: number[] = [8.07131, 1730.63, 233.426];
  private static readonly tempRange_99_374: number[] = [8.14019, 1810.94, 244.485];

  /**
   * The vapour pressure of water may be approximated as a function of temperature.
   * Throws an exception, if temperature is outside of range 1-374°C.
   * 
   * @param degreesCelcius - The temperature to approximate the pressure of water vapour.
   * @returns Water vapour pressure in terms of bars.
   */
  public static waterVapourPressureInBars(degreesCelcius: number): number {
    var mmHg = VapourPressure.waterVapourPressure(degreesCelcius);
    var pascals = VapourPressure.mmHgToPascal(mmHg);
    return PressureConverter.pascalToBar(pascals);
  };

  /**
  * Returns the definition of mmHg (millimeters mercury) in terms of Pascal.
  * 
  * @param mmHg - Millimeters high or depth.
  * @returns Typically defined as weight density of mercury.
  */
  private static mmHgToPascal(mmHg: number): number {
    if (!mmHg) {
      mmHg = 1;
    }

    return (Density.mercury / 1000) * Gravity.current * mmHg;
  };

  /**
  * The vapour pressure of water may be approximated as a function of temperature.
  * Based on the Antoine_equation http://en.wikipedia.org/wiki/Antoine_equation
  * http://en.wikipedia.org/wiki/Vapour_pressure_of_water 
  *
  * @param degreesCelcius - The temperature to approximate the pressure of water vapour.
  * @returns Water vapour pressure in terms of mmHg.
  */
  private static waterVapourPressure(degreesCelcius: number): number {
    var rangeConstants;
    if (degreesCelcius >= 1 && degreesCelcius <= 100)
      rangeConstants = VapourPressure.tempRange_1_100;
    else if (degreesCelcius >= 99 && degreesCelcius <= 374)
      rangeConstants = VapourPressure.tempRange_99_374;
    else
      throw 'Temperature is out of supported range 1-374°C';

    var logp = rangeConstants[0] - (rangeConstants[1] / (rangeConstants[2] + degreesCelcius));
    return Math.pow(10, logp);
  };
}

export class PressureConverter {
  private static readonly coefficient: number = 100000;

  /**
   * Calculates the pascal to bar derived unit. 100000 pascals = 1 bar.
   * 
   * @param pascals - The pascal SI derived unit.
   * @returns Bar derived unit of pressure from pascal.
   */
  public static pascalToBar(pascals: number): number {
    return pascals / (SurfacePressure.current * PressureConverter.coefficient);
  };

  /**
   * Calculates the bar to pascal derived unit. 100000 pascals = 1 bar.
   * 
   * @param bars - The bar derived unit.
   * @returns >Pascal derived unit of pressure from bars.
   */
  public static barToPascal(bars: number): number {
    return bars * (SurfacePressure.current * PressureConverter.coefficient);
  };

  /**
   * Calculates the partial pressure of a gas component from the volume gas fraction and total pressure.
   * 
   * @param absPressure - The total pressure P in bars (typically 1 bar of atmospheric pressure + x bars of water pressure).
   * @param volumeFraction - The volume fraction of gas component (typically 0.79 for 79%) measured as percentage in decimal.
   * @returns The partial pressure of gas component in bar absolute.
   */
  public static partialPressure(absPressure: number, volumeFraction: number): number {
    return absPressure * volumeFraction;
  };
}