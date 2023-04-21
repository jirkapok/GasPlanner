import { Precision } from './precision';
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

    /** sets consumed and reserve for all tanks to 0 */
    public static resetConsumption(tanks: Tank[]): void {
        tanks.forEach(tank => {
            tank.consumed = 0;
            tank.reserve = 0;
        });
    }

    /**
     * Removed item from collection and resets remaining items ID attribute
     * @returns New collection without removed element.
     */
    public static removeTank(tanks: Tank[], tank: Tank): Tank[] {
        const result = tanks.filter(g => g !== tank);
        Tanks.renumberIds(result);
        return result;
    }

    /** Fixes IDs of all tanks */
    public static renumberIds(tanks: Tank[]): void {
        for (let index = 0; index < tanks.length; index++) {
            const current = tanks[index];
            current.id = index + 1;
        }
    }
}

export class Tank {
    /** Gets or sets a unique identifier of the tank in its collection */
    public id = 0;
    /** Gets or sets the consumed pressure of gas in bars */
    public consumed = 0;
    /** Gets or sets the reserve which should remain in the tank in bars */
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

    public get gas(): Gas {
        return this._gas;
    }

    /** o2 content in percent adjusted to iterate to Air*/
    public get o2(): number {
        return AirO2Pin.getO2(this.gas.fO2, this.gas.fHe);
    }

    /** The helium part of tank gas in percents */
    public get he(): number {
        const current = this.gas.fHe * 100;
        return Precision.roundTwoDecimals(current);
    }

    /** Gets total volume at start pressure in liters */
    public get volume(): number {
        return this.size * this.startPressure;
    }

    /** Gets not null name of the content gas based on O2 fraction */
    public get name(): string {
        return StandardGases.nameFor(this._gas.fO2, this._gas.fHe);
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

    /** o2 content in percent adjusted to iterate to Air*/
    public set o2(newValue: number) {
        this._gas.fO2 = AirO2Pin.setO2(newValue, this.gas.fHe);
    }

    /** The helium part of tank gas in percents */
    public set he(newValue: number) {
        this.gas.fHe = newValue / 100;
    }

    /** Creates 15 L, filled with 200 bar Air */
    public static createDefault(): Tank {
        return new Tank(15, 200, StandardGases.o2InAir * 100);
    }

    public assignStandardGas(standard: string): void {
        const found = StandardGases.byName(standard);

        if (!found) {
            return;
        }

        this._gas.fO2 = found.fO2;
        this._gas.fHe = found.fHe;
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


/**
 * Fix for O2 from 21 % in the UI to 20.9 stored for Air.
 * Does not affect another value ranges.
 */
export class AirO2Pin {
    private static readonly pinnedO2 = 21;
    private static readonly o2InAirPercent = StandardGases.o2InAir * 100;

    public static getO2(fO2: number, fHe: number): number {
        const current = fO2 * 100;

        // TODO move rounding to tank
        if (this.isInAirRange(current, fHe)) {
            return AirO2Pin.pinnedO2;
        }

        // for both o2 and he, we are fixing the javascript precision
        return Precision.roundTwoDecimals(current);
    }

    public static setO2(newO2: number, fHe: number): number {
        if (this.isInAirRange(newO2, fHe)) {
            return StandardGases.o2InAir;
        }

        return newO2 / 100;
    }

    private static isInAirRange(newO2: number, fHe: number): boolean {
        return AirO2Pin.o2InAirPercent <= newO2 && newO2 <= AirO2Pin.pinnedO2 && fHe === 0;
    }
}
