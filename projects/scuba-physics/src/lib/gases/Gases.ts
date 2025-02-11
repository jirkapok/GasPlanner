import _ from 'lodash';
import { Precision } from '../common/precision';
import { DepthConverter } from '../depth-converter';
import { DepthLevelOptions, DepthLevels } from '../DepthLevels';
import { Event, EventsFactory } from '../CalculatedProfile';
import { Tank } from './Tanks';
import { GasMixtures } from './GasMixtures';

/**
 * The only issue with gases is, that there is no gas.
 * If the depths aren't covered by gases, than the last selected gas is used, even it results in other events.
 * Deco gases are preferred for decompression, they don't have to be better.
 */
export class GasesValidator {
    /**
     * @param gases not null list of gases to validate
     */
    public static validate(gases: Gases): Event[] {
        const events: Event[] = [];

        if (!gases.hasBottomGas) {
            const event: Event = EventsFactory.createError('At least one bottom gas has to be defined.');
            events.push(event);
            return events;
        }

        return events;
    }
}

export interface GasOptions {
    maxPpO2: number;
    maxDecoPpO2: number;
    /** Maximum narcotic depth in meters */
    maxEND: number;
}

export interface BestGasOptions {
    /** depth in meters */
    currentDepth: number;

    maxDecoPpO2: number;

    /** Maximum narcotic depth in meters */
    maxEnd: number;

    /** True, if oxygen fraction should be considered narcotic, otherwise false */
    oxygenNarcotic: boolean;

    /** We are searching for better gas than the current */
    currentGas: Gas;
}

export class OCGasSource {
    private depthLevels: DepthLevels;
    private depthConverter: DepthConverter;

    constructor(private gases: Gases, options: DepthLevelOptions) {
        // because we want to handle gas switch depths from user perspective not from pressure point of view
        this.depthConverter = DepthConverter.simple();
        this.depthLevels = new DepthLevels(this.depthConverter, options);
    }

    /**
     * Finds better gas to switch to from current depth. Returns current gas, if no better gas was found.
     * Better gas is breathable at current depth and with higher O2, because during decompression we need to offgass both He and N2.
     * Use this method to find decompression gas during ascent.
     */
    public bestGas(options: BestGasOptions): Gas {
        const currentPressure = this.depthConverter.toBar(options.currentDepth);
        const maxEndPressure = this.depthConverter.toBar(options.maxEnd);
        let found = options.currentGas;

        this.gases.all.forEach((candidate: Gas) => {
            const modPressure = candidate.mod(options.maxDecoPpO2);
            // e.g. oxygen at 6m wouldn't be best for 6m without rounding
            const mod = this.depthLevels.toDecoStop(modPressure);
            const end = candidate.end(currentPressure, options.oxygenNarcotic);

            // We allow switch to gas with higher nitrogen content, if no better gas is available, but at least show warning
            if (options.currentDepth <= mod && end <= maxEndPressure) {
                // We don't care about gas ceiling, because it is covered by higher O2 content
                // only oxygen content is relevant for decompression => EAN50 is better than TRIMIX 25/25
                if (!found || found.fO2 < candidate.fO2) {
                    found = candidate;
                }
            }
        });
        return found;
    }

    /**
     *  Finds gas with minimum ppO2, but breath able at air break.
     *  Returns currentGas in case no gas meets the criteria.
     *  (usually normoxic)
     *  @param depth current depth in meters
     *  @param currentGas not null currently gas
     */
    public airBreakGas(depth: number, currentGas: Gas): Gas {
        const ambientPressure = this.depthConverter.toBar(depth);

        const found = _(this.gases.all)
            .filter(g => {
                const gasPpO2 = GasMixtures.partialPressure(ambientPressure, g.fO2);
                return gasPpO2 >= GasMixtures.minPpO2;
            })
            .minBy(g => g.fO2);
        return found || currentGas;
    }
}

export class Gases {
    private items: Gas[] = [];

    public get all(): Gas[] {
        return this.items.slice();
    }

    public get hasBottomGas(): boolean {
        return this.items.length >= 1;
    }

    public static fromTanks(tanks: Tank[]): Gases {
        const gases = new Gases();

        // everything except first gas is considered as deco gas
        tanks.forEach((tank) => {
            gases.add(tank.gas);
        });

        return gases;
    }

    public add(gas: Gas): void {
        this.items.push(gas);
    }

    public isRegistered(gas: Gas): boolean {
        return this.items.includes(gas);
    }
}

export class Gas {
    private static nameFor: (fO2: number, fHe: number) => string;
    private static byName: (gasName: string) => Gas | null;
    private _contentCode = 0;

    /**
     * @param _fO2 partial pressure of O2 in the mix, range 0-1
     * @param _fHe partial pressure of He in the mix, range 0-1
     */
    constructor(private _fO2: number, private _fHe: number) {
        if (this.contentExceeds100percent()) {
            throw new Error('O2 + He can\'t exceed 100 %');
        }

        this.updateContentCode();
    }

    /** Nitrox fraction in range 0 - 1 */
    public get fN2(): number {
        return 1 - this._fO2 - this._fHe;
    }

    /** Oxygen fraction in range 0 - 1 */
    public get fO2(): number {
        return this._fO2;
    }

    /** Helium fraction in range 0 - 1 */
    public get fHe(): number {
        return this._fHe;
    }

    /** Gets not null name of the content gas based on O2 and he fractions */
    public get name(): string {
        return Gas.nameFor(this.fO2, this.fHe);
    }

    /** Unique identifier of content */
    public get contentCode(): number {
        return this._contentCode;
    }

    public set fO2(newValue: number) {
        this._fO2 = newValue > 1 ? 1 : newValue;

        if (this.contentExceeds100percent()) {
            this._fHe = this.countRemaining(this._fO2);
        }

        this.updateContentCode();
    }

    public set fHe(newValue: number) {
        this._fHe = newValue > 0.99 ? 0.99 : newValue;

        if (this.contentExceeds100percent()) {
            this._fO2 = this.countRemaining(this._fHe);
        }

        this.updateContentCode();
    }

    /** For internal use only */
    public static init(nameFor: (fO2: number, fHe: number) => string, byName: (gasName: string) => Gas | null) {
        Gas.nameFor = nameFor;
        Gas.byName = byName;
    }

    public copy(): Gas {
        return new Gas(this._fO2, this._fHe);
    }

    /**
     * Calculates maximum operation depth.
     *
     * @param ppO2 Partial pressure of oxygen.
     * @returns Depth in bars.
     */
    public mod(ppO2: number): number {
        return GasMixtures.mod(ppO2, this._fO2);
    }

    /**
     * Calculates equivalent narcotic depth as the depth which would produce the same narcotic effect when breathing air.
     *
     * @param currentDepth Current depth in bars for which you want to calculate the end.
     * @param oxygenNarcotic True, if oxygen is considered narcotic, otherwise false.
     * @returns Depth in bars. May return pressure lower than surface pressure!
     */
    public end(currentDepth: number, oxygenNarcotic: boolean): number {
        const fO2 = oxygenNarcotic ? this._fO2 : 0;
        return GasMixtures.end(currentDepth, this.fN2, fO2);
    }

    /**
     * Calculates maximum depth, at which the narcotic effect corresponds to the given narcotic depth.
     *
     * @param narcoticDepth END in bars for which you want to calculate the mnd.
     * @param oxygenNarcotic True, if oxygen is considered narcotic, otherwise false.
     * @returns Depth in bars.
     */
    public mnd(narcoticDepth: number, oxygenNarcotic: boolean): number {
        const fO2 = oxygenNarcotic ? this._fO2 : 0;
        return GasMixtures.mnd(narcoticDepth, this.fN2, fO2);
    }

    /**
    * Calculates minimum depth at which the gas is breathe able.
    *
    * @param surfacePressure surface pressure in bars.
    * @returns Depth in bars.
    */
    public ceiling(surfacePressure: number): number {
        return GasMixtures.ceiling(this._fO2, surfacePressure);
    }

    public compositionEquals(other: Gas): boolean {
        return !!other &&
            this._fO2 === other._fO2 &&
            this._fHe === other._fHe;
    }

    public assignStandardGas(gasName: string): void {
        const found = Gas.byName(gasName);

        if (!found) {
            return;
        }

        this.fO2 = found.fO2;
        this.fHe = found.fHe;
    }

    private contentExceeds100percent(): boolean {
        return this._fO2 + this._fHe > 1;
    }

    private countRemaining(part: number): number {
        const rest = 1 - part;
        return Precision.round(rest, 5);
    }

    private updateContentCode(): void {
        const fourK = 10000;
        // considered identical gas rounding on two decimal places
        this._contentCode = Precision.round(this._fO2 * fourK * fourK) +
                            Precision.round(this._fHe * fourK);
    }
}
