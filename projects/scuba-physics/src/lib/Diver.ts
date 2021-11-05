import { Tank } from './Tanks';

export class Diver {
    /** default descent speed value in meter/min. */
    public static readonly descSpeed = 20;
    /** default ascent speed value in meter/min. */
    public static readonly ascSpeed = 10;

    /** Maximum ppO2 during decompression */
    public maxDecoPpO2 = 1.6;

    /**
     * @param sac liter/min
     * @param maxPpO2 maximal partial pressure of o2 in range 0-3
     */
    constructor(public sac: number, public maxPpO2: number) {
    }

    /** liter/min as 3x sac */
    public get stressSac(): number {
        return this.sac * 3;
    }

    /**
     * Returns Bar/minute or Bar/second based on sac for given tank
     * @param sac in Liters/min or Liters/second
     * @param tankSize in Liters
     */
    public static gasSac(sac: number, tankSize: number): number {
        return sac / tankSize;
    }

    /**
     * Returns Bar/minute or Bar/second based on sac for given tank
     */
    public gasSac(tank: Tank): number {
        return Diver.gasSac(this.sac, tank.size);
    }

    public loadFrom(other: Diver): void {
        this.sac = other.sac;
        this.maxPpO2 = other.maxPpO2;
        this.maxDecoPpO2 = other.maxDecoPpO2;
    }
}
