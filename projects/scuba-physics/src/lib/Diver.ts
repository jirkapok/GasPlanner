import { Tank } from "./Tanks";

export class Diver {
    /** default descent speed value in meter/min. */
    public static readonly descSpeed = 20;
    /** default ascent speed value in meter/min. */
    public static readonly ascSpeed = 10;

    /** Maximum ppO2 during decompression */
    public maxDecoPpO2 = 1.6;

    /**
     * @param sac liter/min
     * @param maxPpO2 [-]
     */
    constructor(public sac: number, public maxPpO2: number) {
    }

    /** liter/min */
    public get stressSac(): number {
        return this.sac * 3;
    }

    /** bar/minute or bar/second based on sac */
    public static gasSac(sac: number, gasSize: number): number {
        return sac / gasSize;
    }

    public gasSac(gas: Tank): number {
        return Diver.gasSac(this.sac, gas.size);
    }

    public loadFrom(other: Diver): void {
        this.sac = other.sac;
    }
}