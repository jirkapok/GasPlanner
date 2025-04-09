import { Tank } from '../consumption/Tanks';

/**
 * See also https://www.omnicalculator.com/physics/air-density and https://en.wikipedia.org/wiki/Density_of_air#Temperature
 */
export class AirWeight {
    /** Theoretical weight of 1 liter dry air in grams based on standard atmospheric pressure at 15 °C. */
    private static readonly airDensity = 1.225;

    /**
     * Calculates approximate weight of air in kilograms in tank by consumed amount in bars.
     * We don't check, if the content of the tank is really an air.
     * @param tank used to extract consumed bars and size
     */
    public static tankVolumeWeight(tank: Tank): number {
        const consumedVolume = tank.consumedVolume;
        return AirWeight.volumeWeight(consumedVolume);
    }

    /**
     * Calculates approximate weight of air in kilograms in tank by consumed amount in bars.
     * @param consumedVolume in liters
     */
    public static volumeWeight(consumedVolume: number): number {
        const grams = consumedVolume * AirWeight.airDensity;
        return grams / 1000;
    }
}
