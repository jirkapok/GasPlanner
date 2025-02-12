import { Gas } from '../gases/Gases';

export class Compressibility {
    private readonly o2Coefficients = [-7.18092073703e-4, 2.81852572808e-6, -1.50290620492e-9];
    private readonly n2Coefficients = [-2.19260353292e-4, 2.92844845532e-6, -2.07613482075e-9];
    private readonly heCoefficients = [4.87320026468e-4, -8.83632921053e-8, 5.33304543646e-11];

    private virial(pressure: number, coefficients: number[]): number {
        return coefficients[0] * pressure +
            coefficients[1] * pressure * pressure +
            coefficients[2] * pressure * pressure * pressure;
    }

    public zFactor(p: number, gas: Gas): number {
        return (
            1 +
            gas.fO2 * this.virial(p, this.o2Coefficients) +
            gas.fHe * this.virial(p, this.heCoefficients) +
            gas.fN2 * this.virial(p, this.n2Coefficients)
        );
    }

    public normalVolumeFactor(gasPressure: number, gas: Gas): number {
        return (gasPressure * this.zFactor(1, gas)) / this.zFactor(gasPressure, gas);
    }

    public findPressure(gas: Gas, volume: number): number {
        let foundPressure = volume;
        while (Math.abs(this.zFactor(1, gas) * foundPressure - this.zFactor(foundPressure, gas) * volume) > 0.000001) {
            foundPressure = (volume * this.zFactor(foundPressure, gas)) / this.zFactor(1, gas);
        }
        return foundPressure;
    }
}
