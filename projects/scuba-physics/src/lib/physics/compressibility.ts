import { Gas } from '../gases/Gases';
import { TankFill } from "../consumption/Tanks";

/**
 * Real gas compression calculator. Does not use Gas ideal law, instead uses Z-factor.
 * Formulas reused from https://github.com/atdotde/realblender.
 * The same formula is also used in Subsurface.
 * The formulas work in range 0-500 b.
 * Original source does not mention, at which temperature the constants were collected.
 */
export class Compressibility {
    // doesn't need to be altitude pressure, since its effect is negligible.
    private normalPressure: number = 1;
    private readonly o2Coefficients = [-7.18092073703e-4, 2.81852572808e-6, -1.50290620492e-9];
    private readonly n2Coefficients = [-2.19260353292e-4, 2.92844845532e-6, -2.07613482075e-9];
    private readonly heCoefficients = [4.87320026468e-4, -8.83632921053e-8, 5.33304543646e-11];

    private virial(pressure: number, coefficients: number[]): number {
        return coefficients[0] * pressure +
            coefficients[1] * pressure * pressure +
            coefficients[2] * pressure * pressure * pressure;
    }

    /**
     * Calculates compressibility Z-factor for given gas mixture at given pressure.
     * See also https://www.divegearexpress.com/library/articles/zfactors-for-scuba
     * @param gasPressure Absolute gas pressure in bar
     * @param gas Not empty gas mixture
     **/
    public zFactor(gasPressure: number, gas: Gas): number {
        return (
            1 +
            gas.fO2 * this.virial(gasPressure, this.o2Coefficients) +
            gas.fHe * this.virial(gasPressure, this.heCoefficients) +
            gas.fN2 * this.virial(gasPressure, this.n2Coefficients)
        );
    }

    /**
     * Calculates real available volume in liters for given tank.
     * See also https://www.divegearexpress.com/library/articles/calculating-scuba-cylinder-capacities
     * @param tank Not empty tank fill.
     * @param gas Not empty gas mixture.
     * @returns Real volume of given gas in liters stored in the tank.
     **/
    public tankVolume(tank: TankFill, gas: Gas): number {
        // Add 1 atm to the pressure gauge to become absolute pressure, since all calculations here an absolute pressure.
        const absolutePressure = tank.startPressure + this.normalPressure;
        const unitVolume = this.normalVolume(absolutePressure, gas);
        // Subtracting the size of the tank, because 0 b pressure gauge means the remaining gas is still approximately at 1 atm.
        return (unitVolume * tank.size) - tank.size;
    }

    /**
     * Finds current tank pressure for given gas volume with precision of 0.000001 b.
     * Returns relative pressure shown on the tank pressure gauge.
     * @param gas Not empty gas mixture.
     * @param tankSize Tank dimension in liters.
     * @param volume gas volume in liters Stored in the tank.
     */
    public tankPressure(gas: Gas, tankSize: number, volume: number): number {
        const absoluteVolume = (volume + tankSize) / tankSize;
        const absolutePressure = this.pressure(gas, absoluteVolume);
        return absolutePressure - this.normalPressure;
    }

    /**
     * Calculates absolute real volume in liters of gas in 1 L container for given gas mixture at 1 bar.
     * @param gasPressure current absolute gas pressure in bar
     * @param gas Not empty gas mixture
     **/
    public normalVolume(gasPressure: number, gas: Gas): number {
        return (gasPressure * this.zFactor(this.normalPressure, gas)) / this.zFactor(gasPressure, gas);
    }

    /**
     * Finds current gas absolute pressure for given gas volume with precision of 0.000001 b.
     * @param gas Not empty gas mixture
     * @param volume Absolute gas volume in liters
     */
    public pressure(gas: Gas, volume: number): number {
        // TODO find limits for max. volume otherwise this method never ends.
        let foundPressure = volume;
        const normalZfactor = this.zFactor(this.normalPressure, gas);
        while (Math.abs(normalZfactor * foundPressure - this.zFactor(foundPressure, gas) * volume) > 0.000001) {
            foundPressure = (volume * this.zFactor(foundPressure, gas)) / normalZfactor;
        }
        return foundPressure;
    }
}
