import { Gas, StandardGas } from "./Gases";

export class Tank {
    public consumed = 0;
    public reserve = 0;
    private _gas:Gas = new Gas(0.21, 0);

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

    /** o2 content in percent */
    public get o2(): number {
        return this._gas.fO2 * 100;
    }

    /** o2 content in percent */
    public set o2(newValue) {
        this._gas.fO2 = newValue / 100;
    }

    /**
     * Returns label of ths standard nitrox gas based on its O2 content
     * @param o2 in percents
     */
    public static nameFor(o2: number): string {
        const fromEnum = StandardGas[o2];
        if (!!fromEnum) {
            return fromEnum;
        }

        if (!!o2) {
            if(o2 >= 100) {
                return StandardGas[StandardGas.OXYGEN];
            }

            return 'EAN' + o2.toString();
        }

        return '';
    }

    public get volume(): number {
        return this.size * this.startPressure;
    }

    public get name(): string {
        return Tank.nameFor(this.o2);
    }

    public assignStandardGas(standard: string): void {
        this.o2 = StandardGas[standard];
    }

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

    public get hasReserve(): boolean {
        return this.endPressure - this.reserve > 0;
    }

    public loadFrom(other: Tank): void {
        this.startPressure = other.startPressure;
        this.size = other.size;
        this.o2 = other.o2;
    }
}