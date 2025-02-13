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
        // TODO verify, if using compressibility at 1 atm makes sense here
        return Diver.gasSac(this.rmv, tank.size);
    }

    public loadFrom(other: Diver): void {
        this.rmv = other.rmv;
        this.stressRmv = other.stressRmv;
    }
}
