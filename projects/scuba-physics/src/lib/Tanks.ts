import { Gas, StandardGases } from './Gases';

export class Tanks {
    /**
     * Checks, if all tanks have more remaining gas than their reserve.
     * See also Tank.hasReserve
     */
    public static haveReserve(tanks: Tank[]): boolean {
        for (let index = 0; index < tanks.length; index++) {
            if (!tanks[index].hasReserve) {
                return false;
            }
        }

        return true;
    }

    /** Creates new instances of tanks from loaded/deserialized collection. Returns not null collection of tanks copies */
    public static loadTanks(tanks: Tank[]): Tank[] {
        const newTanks: Tank[] = [];

        if (tanks && tanks.length > 0) {
            for (let index = 0; index < tanks.length; index++) {
                const currentTank = tanks[index];
                const newTank = new Tank(currentTank.size, currentTank.startPressure, currentTank.o2);
                newTank.loadFrom(currentTank); // rest not handled by constructor
                newTanks.push(newTank);
            }
        }

        return newTanks;
    }

    /** sets consumed and reserve for all tanks to 0 */
    public static resetConsumption(tanks: Tank[]): void {
        tanks.forEach(tank => {
            tank.consumed = 0;
            tank.reserve = 0;
        });
    }
}

export class Tank {
    /** Gets or sets the consumed liters of gas */
    public consumed = 0;
    /** Gets or sets the reserve which should remain in the tank in liters */
    public reserve = 0;

    private _gas: Gas = StandardGases.air.copy();

    /**
     * Creates new instance of the Gas.
     *
     * @param size Volume in liters
     * @param o2Percent Percents of oxygen e.g. 20%
     * @param startPressure Filled in bars of gas
     */
    constructor(public size: number,
        public startPressure: number,
        o2Percent: number) {
        this.o2 = o2Percent;
    }

    /** Creates 15 L, filled with 200 bar Air */
    public static createDefault(): Tank {
        return new Tank(15, 200, StandardGases.o2InAir * 100);
    }

    public get gas(): Gas {
        return this._gas;
    }

    /** o2 content in percent adjusted to iterate to Air*/
    public get o2(): number {
        const current = this._gas.fO2 * 100;

        if (this.isInAirRange(current)) {
            return Math.round(this.gas.fO2 * 100);
        }

        return current;
    }

    /** o2 content in percent adjusted to iterate to Air*/
    public set o2(newValue: number) {
        if (this.isInAirRange(newValue)) {
            this.gas.fO2 = StandardGases.o2InAir;
        } else {
            this._gas.fO2 = newValue / 100;
        }
    }

    /** Gets total volume at start pressure in liters */
    public get volume(): number {
        return this.size * this.startPressure;
    }

    // TODO count also with He fraction
    /** Gets not null name of the content gas based on O2 fraction */
    public get name(): string {
        return StandardGases.nameFor(this._gas.fO2);
    }

    public assignStandardGas(standard: string): void {
        const found = StandardGases.byName(standard);

        if (!found) {
            return;
        }

        this._gas.fO2 = found.fO2;
        this._gas.fHe = found.fHe;
    }

    /** calculated value in range 0 - start pressure in bars  */
    public get endPressure(): number {
        const remaining = this.startPressure - this.consumed;

        if (remaining > 0) {
            return remaining;
        }

        return 0;
    }

    public get percentsRemaining(): number {
        return this.endPressure / this.startPressure * 100;
    }

    public get percentsReserve(): number {
        const result = this.reserve / this.startPressure * 100;

        if (result > 100) {
            return 100;
        }

        return result;
    }

    /**
     * Returns true, if remaining gas is greater or equal to reserve; otherwise false.
     * See also Consumption.haveReserve()
     */
    public get hasReserve(): boolean {
        return this.endPressure >= this.reserve;
    }

    public loadFrom(other: Tank): void {
        this.size = other.size;
        this.startPressure = other.startPressure;
        this.consumed = other.consumed;
        this.reserve = other.reserve;
        // copy private fields as serialized
        this.gas.fO2 = other._gas.fO2;
        this.gas.fHe = other._gas.fHe;
    }

    private isInAirRange(newO2: number): boolean {
        return 20.9 <= newO2 && newO2 <= 21 && this.gas.fHe === 0;
    }
}
