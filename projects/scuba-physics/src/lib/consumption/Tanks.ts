import { Precision } from '../common/precision';
import { GasMixtures } from '../gases/GasMixtures';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Compressibility } from "../physics/compressibility";

export interface TankFill {
    /** Start pressure in bars as non zero positive number as shown on the pressure gauge (not absolute pressure). */
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
    private static minimumZero = 0;
    /** Gets or sets a unique identifier of the tank in its collection */
    public id = 0;
    private _size = 0;
    // Primary storage is always in liters to keep precision.
    private _startVolume = 0;
    private _consumedVolume = 0;
    private _reserveVolume = 0;
    // Storing both volume and pressure to prevent calculations on every getter.
    private _startPressure = 0;
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

        if(startPressure < Tank.minimumZero) {
            throw new Error('Start pressure needs to be positive number greater than atmospheric pressure in bars');
        }

        this._size = size;
        this.o2 = o2Percent;
        // changing the gas content affects stored volumes, so we need to set it first before start pressure.
        this.startPressure = startPressure;
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

        // covered in size, startPressure and consumed setter, here to prevent rounding issues
        if (remaining > Tank.minimumZero) {
            return remaining;
        }

        return Tank.minimumZero;
    }

    /** Gets volume of remaining gas in liters */
    public get endVolume(): number {
        const remaining = this.volume - this.consumedVolume;

        // covered in size, startPressure and consumed setter, here to prevent rounding issues
        if (remaining > Tank.minimumZero) {
            return remaining;
        }

        return Tank.minimumZero;
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
     * Gets the gas mixture in the tank.
     * Changing the gas does not preserve the total volume of stored gas.
     * DO NOT change the gas properties directly on the gas object.
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

    /** Gets total volume of stored gas at start pressure in liters using real gas compressibility */
    public get volume(): number {
        return this._startVolume;
    }

    /** Gets total volume of gas reserve in liters using real gas compressibility */
    public get reserveVolume(): number {
        return this._reserveVolume;
    }

    /** Gets total volume of consumed gas in liters using real gas compressibility */
    public get consumedVolume(): number {
        return this._consumedVolume;
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
        // gas needs to be set first, since it affects compressibility factor.
        this._gas.fO2 = AirO2Pin.setO2(newValue, this.gas.fHe);
        // update volume based on compressibility, protecting pressure defined by user, not volume.
        this.startPressure = this.startPressure;
    }

    /** The helium part of tank gas in percents */
    public set he(newValue: number) {
        // gas needs to be set first, since it affects compressibility factor.
        this.gas.fHe = newValue / 100;
        // update volume based on compressibility, protecting pressure defined by user, not volume.
        this.startPressure = this.startPressure;
    }

    public set startPressure(newValue: number) {
       if(newValue < Tank.minimumZero) {
           this._startPressure = Tank.minimumZero;
       } else {
           this._startPressure = newValue;
       }

       this.fitStoredVolumes();
    }

    public set size(newValue: number) {
        // Consider to make the size readonly
        if(newValue < Tank.minimumSize) {
            this._size = Tank.minimumSize
        } else {
            this._size = newValue;
        }

        this.fitStoredVolumes();
    }

    public set consumed(newPressure: number) {
        const newConsumedVolume = Tank.realVolume2(this.size, newPressure, this.gas);
        this.updateConsumed(newPressure, newConsumedVolume);
    }

    public set consumedVolume(newVolume: number) {
        if(newVolume > this.volume) { // This ensures reasonable pressure
            newVolume = this.volume;
        }

        let newConsumedPressure = Tank.toTankPressure(this.gas, this.size, newVolume);
        newConsumedPressure = Precision.ceil(newConsumedPressure);
        this.updateConsumed(newConsumedPressure, newVolume);
    }

    public set reserve(newPressure: number) {
        const reserveVolume = Tank.realVolume2(this.size, newPressure, this.gas);
        this.updateReserve(newPressure, reserveVolume);
    }

    public set reserveVolume(newVolume: number) {
        if(newVolume > this.volume) { // This ensures reasonable pressure
            newVolume = this.volume;
        }

        let newPressure = Tank.toTankPressure(this.gas, this.size, newVolume);
        newPressure = Precision.ceil(newPressure);
        this.updateReserve(newPressure, newVolume);
    }

    /** Creates 15 L, filled with 200 bar Air */
    public static createDefault(): Tank {
        return new Tank(15, 200, GasMixtures.o2InAir * 100);
    }

    /** Gets total volume of stored gas at start pressure in liters using real gas compressibility */
    public static realVolume(tank: TankFill, gas: Gas): number {
        const compressibility = new Compressibility();
        const realVolume = compressibility.tankVolume(tank, gas);
        return realVolume;
    }

    private static toTankPressure(gas: Gas, tankSize: number, volume: number): number {
        const compressibility = new Compressibility();
        const pressure = compressibility.tankPressure(gas, tankSize, volume);
        return pressure;
    }

    public static realVolume2(size: number, pressure: number, gas: Gas): number {
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
        // copy private fields as serialized
        // gas needs to be first, since it affects compressibility factor
        this.gas.fO2 = other._gas.fO2;
        this.gas.fHe = other._gas.fHe;

        this.size = other.size;
        this.startPressure = other.startPressure;
        this.consumedVolume = other.consumedVolume;
        this.reserve = other.reserve;
    }

    public toString(): string {
        return `Tank ${this.id}:${this.name},${this.size} L,${this.startPressure} b`;
    }

    private fitStoredVolumes(): void {
        this._startVolume = Tank.realVolume2(this.size, this.startPressure, this.gas);
        // limit the pressure to reasonable maximum value, since for high pressures compressibility factor no longer works.
        const newConsumedVolume = this.consumedVolume > this._startVolume ? this._startVolume : this.consumedVolume;
        let newConsumedPressure = Tank.toTankPressure(this.gas, this.size, newConsumedVolume);
        newConsumedPressure = Precision.ceil(newConsumedPressure);
        this.updateConsumed(newConsumedPressure, newConsumedVolume);
    }

    /** to keep volume and pressure aligned */
    private updateConsumed(newPressure: number, newVolume: number): void {
        if(newVolume > this.volume) {
            this._consumedVolume = this.volume;
        } else if(newVolume < Tank.minimumZero) {
            this._consumedVolume = Tank.minimumZero;
        } else {
            this._consumedVolume = newVolume;
        }

        // because rounding still does not have to fit
        if(newPressure > this.startPressure) {
            this._consumed = this.startPressure;
        } else if(newPressure < Tank.minimumZero) {
            this._consumed = Tank.minimumZero;
        } else {
            this._consumed = newPressure;
        }
    }

    private updateReserve(newPressure: number, newVolume: number) {
        if(newVolume > this.volume) {
            this._reserveVolume = this.volume;
        } else if(newVolume < Tank.minimumZero) {
            this._reserveVolume = Tank.minimumZero;
        } else {
            this._reserveVolume = newVolume;
        }

        // because rounding still does not have to fit
        if(newPressure > this.startPressure) {
            this._reserve = this.startPressure;
        } else if(newPressure < Tank.minimumZero) {
            this._reserve = Tank.minimumZero;
        } else {
            this._reserve = newPressure;
        }
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
