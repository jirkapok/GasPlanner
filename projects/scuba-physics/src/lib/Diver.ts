import { OptionDefaults } from './Options';
import { Tank } from './Tanks';

export class Diver {
    // liters/min
    public static readonly defaultSac = 20;
    /** Maximum ppO2 during decompression */
    public maxDecoPpO2 = OptionDefaults.maxDecoPpO2;

    /**
     * @param rmv liter/min
     * @param maxPpO2 maximal partial pressure of o2 in range 0-3
     */
    constructor(public rmv: number = Diver.defaultSac, public maxPpO2: number = OptionDefaults.maxPpO2) {
    }

    /** liter/min as 3x sac */
    public get stressRmv(): number {
        return this.rmv * 3;
    }

    /**
     * Returns Bar/minute or Bar/second based on sac for given tank
     * @param rmv in Liters/min or Liters/second
     * @param tankSize in Liters
     */
    public static gasSac(rmv: number, tankSize: number): number {
        return rmv / tankSize;
    }

    /**
     * Returns Bar/minute or Bar/second based on sac for given tank
     */
    public gasSac(tank: Tank): number {
        return Diver.gasSac(this.rmv, tank.size);
    }

    public loadFrom(other: Diver): void {
        this.rmv = other.rmv;
        this.maxPpO2 = other.maxPpO2;
        this.maxDecoPpO2 = other.maxDecoPpO2;
    }
}
