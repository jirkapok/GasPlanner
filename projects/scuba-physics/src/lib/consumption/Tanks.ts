import { Precision } from '../common/precision';
import { GasMixtures } from '../gases/GasMixtures';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';

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
    /** Gets or sets a unique identifier of the tank in its collection */
    public id = 0;
    // TODO Tank.size cant be changed directly, since it would affect consumed volume, the same applies to startPressure.
    private _size = 0;
    private _startPressure = 0;
    // TODO Tank Consumed needs to be internally stored in liters, since changing tank size or start pressure should not affect it.
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
        if(size <= 0) {
            throw new Error('Size needs to be non zero positive amount in liters');
        }

        if(startPressure <= 0) {
            throw new Error('Start pressure needs to be positive number greater than atmospheric pressure in bars');
        }

        this._size = size;
        this._startPressure = startPressure;
        this.o2 = o2Percent;
    }

    /** Filled in bars of gas */
    public get startPressure(): number {
        return this._startPressure;
    }

    /** Volume in liters */
    public get size(): number {
        return this._size;
    }

    /** Gets or sets the consumed pressure of gas in bars */
    public get consumed(): number {
        return this._consumed;
    }

    /** Gets or sets the reserve which should remain in the tank in bars */
    public get reserve(): number {
        return this._reserve;
    }

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

    /** Gets total volume at start pressure in liters */
    public get volume(): number {
        return Tank.volume(this);
    }

    /** Gets total volume of reserve in liters */
    public get reserveVolume(): number {
        return Tank.volume2(this.size, this.reserve);
    }

    /** Gets total volume of consumed gas in liters */
    public get consumedVolume(): number {
        return Tank.volume2(this.size, this.consumed);
    }

    /** Gets not null name of the content gas based on O2 and he fractions */
    public get name(): string {
        return this._gas.name;
    }

    /**
     * Current pressure in bars. As calculated value of remaining gas in range 0 - start pressure.
     * 0 b minimum means from usage perspective, there always should remain atmospheric pressure.
     **/
    public get endPressure(): number {
        // TODO use compressibility
        const remaining = this.startPressure - this.consumed;

        if (remaining > 0) {
            return remaining;
        }

        // TODO we cant end on 0 b, since there is always gas left at atmospheric pressure.
        return 0;
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
        this._startPressure = newValue;
    }

    public set size(newValue: number) {
        this._size = newValue;
    }

    public set consumed(newValue: number) {
        this._consumed = newValue;
    }

    public set reserve(newValue: number) {
        this._reserve = newValue;
    }

    /** Creates 15 L, filled with 200 bar Air */
    public static createDefault(): Tank {
        return new Tank(15, 200, GasMixtures.o2InAir * 100);
    }

    /** Gets total volume of stored gas at start pressure in liters */
    public static volume(tank: TankFill): number {
        return Tank.volume2(tank.size, tank.startPressure);
    }

    private static volume2(size: number, pressure: number): number {
        return size * pressure;
    }

    public assignStandardGas(gasName: string): void {
        const found = StandardGases.byName(gasName);

        if (!found) {
            return;
        }

        this.gas.fO2 = found.fO2;
        this.gas.fHe = found.fHe;
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
