import { Tank } from './Tanks';

export class Diver {
    /** liters/min **/
    public static readonly defaultSac = 20;

    /** liter/min, usually 1.5x rmv for 1 diver only */
    public stressRmv: number;

    /**
     * @param rmv liter/min
     * @param rmvStress liter/min
     */
    constructor(public rmv: number = Diver.defaultSac, rmvStress?: number) {
        this.stressRmv = rmvStress || rmv * 1.5;
    }

    /**
     * Gets stress RMV for two divers.
     * Value is derived from stressRmv in l/min.
     **/
    public get teamStressRmv() {
        return this.stressRmv * 2;
    }

    /**
     * Returns theoretical average consumption rate
     * in Bar/minute or Bar/second based on sac for given tank.
     * @param rmv in Liters/min or Liters/second
     * @param tankSize in Liters
     */
    public static gasSac(rmv: number, tankSize: number): number {
        // not using compressibility here, because we dont know the gas and we have no idea
        // what is the available pressure difference on the tank.
        return rmv / tankSize;
    }

    /**
     * Returns theoretical average consumption rate
     * in Bar/minute or Bar/second based on sac for given tank.
     */
    public gasSac(tank: Tank): number {
        return Diver.gasSac(this.rmv, tank.size);
    }

    public loadFrom(other: Diver): void {
        this.rmv = other.rmv;
        this.stressRmv = other.stressRmv;
    }
}
