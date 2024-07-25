import { Tank } from './Tanks';

export class Diver {
    // liters/min
    public static readonly defaultSac = 20;
    /** liter/min, usually 1.5x rmv */
    public stressRmv: number;

    /**
     * @param rmv liter/min
     */
    constructor(public rmv: number = Diver.defaultSac) {
        this.stressRmv = rmv * 1.5;
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
    }
}
