import { Precision } from '../common/precision';
import { GasMixtures } from '../gases/GasMixtures';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Compressibility } from "../physics/compressibility";

export interface TankFill {
    /** start pressure in bars as non zero positive number.*/
    startPressure: number;
    /** internal tank water volume in liters as non zero positive number. */
    size: number;
}

export class Tanks {
    public static toGases(tanks: Tank[]): Gases {
        const gases = new Gases();

        // everything except first gas is considered as deco gas
        tanks.forEach((tank) => {
            gases.add(tank.gas);
        });

        return gases;
    }

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

export class Tank implements TankFill {
    private static minimumSize = 0.1;
    // doesn't need to be altitude pressure, since its effect is negligible. See also Compressibility.normalPressure.
    // TODO fix to at least 1 atm to cover atmospheric pressure, see also endPressure
    private atmosphericPressure: number = 1;
    private static minimumPressure = 0;
    /** Gets or sets a unique identifier of the tank in its collection */
    public id = 0;
    private _size = 0;
    private _startPressure = 0;
    // Not storing Consumed and reserve internally in liters,
    // since they are independent on tank size and start pressure.
    private _consumed = 0;
    private _reserve = 0;
    private _gas: Gas = StandardGases.air.copy();

    /**
     * Creates new instance of the Gas.
     *
     * @param size Volume in liters
     * @param o2Percent Percents of oxygen e.g. 20%
     * @param startPressure Filled in bars of gas
     */
    constructor(size: number, startPressure: number, o2Percent: number) {
        if(size < Tank.minimumSize) {
            throw new Error('Size needs to be non zero positive amount in liters');
        }

        if(startPressure < Tank.minimumPressure) {
            throw new Error('Start pressure needs to be positive number greater than atmospheric pressure in bars');
        }

        this._size = size;
        this._startPressure = startPressure;
        this.o2 = o2Percent;
    }

    /**
     * Filled in bars of gas. Relative to atmospheric pressure. The same value as shown on manometer.
     * Changing the value does not preserve the total volume of stored gas.
     **/
    public get startPressure(): number {
        return this._startPressure;
    }

    /**
     * Gets or sets the volume in liters. Changing the value does not preserve the total volume of stored gas.
     * Minimum value is 0.1 liter.
     **/
    public get size(): number {
        return this._size;
    }

    /** Gets or sets the consumed pressure of gas in bars. */
    public get consumed(): number {
        return this._consumed;
    }

    /**
     * Calculated value representing the current pressure in bars as shown on manometer.
     * As calculated value of remaining gas in range 0 - start pressure.
     * Relative to atmospheric pressure.
     **/
    public get endPressure(): number {
        const remaining = this.startPressure - this.consumed;

        if (remaining > Tank.minimumPressure) {
            return remaining;
        }

        return Tank.minimumPressure;
    }

    /**
     * Gets or sets the reserve which should remain in the tank in bars.
     * This value is informative, does not affect other pressure related properties.
     * Relative to atmospheric pressure, the same value as shown on manometer.
     **/
    public get reserve(): number {
        return this._reserve;
    }

    /**
     * Gets or sets the gas mixture in the tank.
     * Changing the gas does not preserve the total volume of stored gas.
     **/
    public get gas(): Gas {
        return this._gas;
    }

    // TODO move percents from tank to new BoundGas
    /** o2 content in percent adjusted to iterate to Air*/
    public get o2(): number {
        return AirO2Pin.getO2(this.gas.fO2, this.gas.fHe);
    }

    /** The helium part of tank gas in percents */
    public get he(): number {
        const current = this.gas.fHe * 100;
        return Precision.roundTwoDecimals(current);
    }

    /** The nitrogen part of tank gas in percents */
    public get n2(): number {
        // calculation needs to reflect o2 pin.
        const current = 100 - this.o2 - this.he;
        return Precision.roundTwoDecimals(current);
    }

    /** Gets total volume of stored gas at start pressure in liters using ideal gas law */
    public get volume(): number {
        return Tank.volume(this);
    }

    /** Gets total volume of stored gas at start pressure in liters using real gas compressibility */
    public get realVolume(): number {
        return Tank.realVolume(this, this.gas);
    }

    /** Gets total volume of gas reserve in liters using ideal gas law */
    public get reserveVolume(): number {
        return Tank.volume2(this.size, this.reserve);
    }

    /** Gets total volume of gas reserve in liters using real gas compressibility */
    public get realReserveVolume(): number {
        return Tank.realVolume2(this.size, this.reserve, this.gas);
    }

    /** Gets total volume of consumed gas in liters using ideal gas law */
    public get consumedVolume(): number {
        return Tank.volume2(this.size, this.consumed);
    }

    /** Gets total volume of consumed gas in liters using real gas compressibility */
    public get realConsumedVolume(): number {
        return Tank.realVolume2(this.size, this.consumed, this.gas);
    }

    /** Gets not null name of the content gas based on O2 and he fractions */
    public get name(): string {
        return this._gas.name;
    }

    /** In meaning of percents of pressure not volume. */
    public get percentsRemaining(): number {
        return this.endPressure / this.startPressure * 100;
    }

    /** In meaning of percents of pressure not volume. */
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

    public set startPressure(newValue: number) {
       if(newValue < Tank.minimumPressure) {
           this._startPressure = Tank.minimumPressure;
       } else {
           this._startPressure = newValue;
       }
    }

    public set size(newValue: number) {
        if(newValue < Tank.minimumSize) {
            this._size = Tank.minimumSize;
        } else {
            this._size = newValue;
        }
    }

    // TODO store consumed in liters internally
    public set consumed(newValue: number) {
        if(newValue > this.startPressure) {
            this._consumed = this.startPressure;
        } else if(newValue < Tank.minimumPressure) {
            this._consumed = Tank.minimumPressure;
        } else {
            this._consumed = newValue;
        }
    }

    public set reserve(newValue: number) {
        if(newValue < Tank.minimumPressure) {
            this._reserve = Tank.minimumPressure;
        } else {
            this._reserve = newValue;
        }
    }

    /** Creates 15 L, filled with 200 bar Air */
    public static createDefault(): Tank {
        return new Tank(15, 200, GasMixtures.o2InAir * 100);
    }

    /** Gets total volume of stored gas at start pressure in liters using ideal gas law */
    public static volume(tank: TankFill): number {
        return Tank.volume2(tank.size, tank.startPressure);
    }

    /** Gets total volume of stored gas at start pressure in liters using real gas compressibility */
    public static realVolume(tank: TankFill, gas: Gas): number {
        const compressibility = new Compressibility();
        const realVolume = compressibility.realVolume(tank, gas);
        return realVolume;
    }

    private static volume2(size: number, pressure: number): number {
        return size * pressure;
    }

    private static realVolume2(size: number, pressure: number, gas: Gas): number {
        const tank = { size, startPressure: pressure };
        return Tank.realVolume(tank, gas);
    }

    public assignStandardGas(gasName: string): void {
        const found = StandardGases.byName(gasName);

        if (!found) {
            return;
        }

        this.gas.fO2 = found.fO2;
        this.gas.fHe = found.fHe;
    }

    /** Copies all properties from another tank except id */
    public loadFrom(other: Tank): void {
        this.size = other.size;
        this.startPressure = other.startPressure;
        this.consumed = other.consumed;
        this.reserve = other.reserve;
        // copy private fields as serialized
        this.gas.fO2 = other._gas.fO2;
        this.gas.fHe = other._gas.fHe;
    }

    public toString(): string {
        return `Tank ${this.id}:${this.name},${this.size} L,${this.startPressure} b`;
    }
}


/**
 * Fix for O2 from 21 % in the UI to 20.9 stored for Air.
 * Does not affect another value ranges.
 */
export class AirO2Pin {
    private static readonly pinnedO2 = 21;
    private static readonly o2InAirPercent = GasMixtures.o2InAir * 100;

    public static getO2(fO2: number, fHe: number): number {
        const current = fO2 * 100;

        if (this.isInAirRange(current, fHe)) {
            return AirO2Pin.pinnedO2;
        }

        // for both o2 and he, we are fixing the javascript precision
        return Precision.roundTwoDecimals(current);
    }

    public static setO2(newO2: number, fHe: number): number {
        if (this.isInAirRange(newO2, fHe)) {
            return GasMixtures.o2InAir;
        }

        return newO2 / 100;
    }

    private static isInAirRange(newO2: number, fHe: number): boolean {
        return AirO2Pin.o2InAirPercent <= newO2 && newO2 <= AirO2Pin.pinnedO2 && fHe === 0;
    }
}
