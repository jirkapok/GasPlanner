// Supported types of salt density of water used to distinguish depth converters
export enum Salinity {
    // 1000 kg/m3
    fresh = 1,
    // EN13319 - 1020 kg/m3
    brackish = 2,
    // 1030 kg/m3
    salt = 3
}

export class Density {
    /**
     * 1000kg / m3 at 0C / 32F (standard conditions for measurements).
     */
    public static readonly fresh: number = 1000;

    /**
     * Brackish water density EN13319 - 1020kg / m3 at 0C / 32F (standard conditions for measurements).
     */
    public static readonly brackish: number = 1020;

    /**
     * 1030kg / m3 at 0C / 32F (standard conditions for measurements).
     */
    public static readonly salt: number = 1030;
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
    /** Standard pressure in bars */
    public static readonly standard: number = 1.01325;
    private static readonly standardPascals = PressureConverter.barToPascal(AltitudePressure.standard);

    // https://en.wikipedia.org/wiki/Barometric_formula
    // https://en.wikipedia.org/wiki/International_Standard_Atmosphere
    private static readonly gasConstant = 8.31432; // J/(mol·K) for air
    private static readonly temperature = 288.15; // kelvin = 15°C
    private static readonly lapsRate = -0.0065;  // kelvin/meter
    private static readonly molarMass = 0.0289644; // kg/mol
    private static readonly exponent = (Gravity.standard * AltitudePressure.molarMass) /
        (AltitudePressure.gasConstant * AltitudePressure.lapsRate);
    private static readonly invertedExponent = 1 / AltitudePressure.exponent;

    /**
     * Calculates pressure at altitude in pascals
     *
     * @param altitude Positive number in meters representing the altitude
     */
    public static pressure(altitude: number): number {
        const base = AltitudePressure.temperature / (AltitudePressure.temperature + AltitudePressure.lapsRate * altitude);
        return AltitudePressure.standardPascals * Math.pow(base, AltitudePressure.exponent);
    }

    /**
     * Returns altitude in meters calculated from atmospheric pressure.
     * Returns 0, if pressure is lower than standard pressure
     * @param pressure in pascals
     */
    public static altitude(pressure: number): number {
        if(pressure >= AltitudePressure.standardPascals) {
            return 0;
        }

        const pressureNormalized = pressure / AltitudePressure.standardPascals;
        const base = Math.pow(pressureNormalized, AltitudePressure.invertedExponent);
        return (AltitudePressure.temperature / base - AltitudePressure.temperature) / AltitudePressure.lapsRate;
    }
}
