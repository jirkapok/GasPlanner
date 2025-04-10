import { TankFill } from '../consumption/Tanks';
import { Precision } from '../common/precision';
import { Compressibility } from "../physics/compressibility";
import { StandardGases } from "../gases/StandardGases";
import { Gas } from "../gases/Gases";

/**
 * Blending result showing amount of each component used
 * All values in bars.
 */
export interface MixResult {
    addO2: number;
    addHe: number;
    addTop: number;
    removeFromSource: number;
}

/**
 * Crate for tank used to mix gases.
 */
export interface TankMix extends Mix {
    /** current pressure in bars */
    pressure: number;
}

/**
 * Crate for gas, both values in range 0-1.
 */
export interface Mix {
    o2: number;
    he: number;
}

/**
 * Crate for gas mix parameters.
 */
export interface MixRequest {
    /** Tank start situation before mix */
    source: TankMix;
    /** Tank end situation after mix */
    target: TankMix;
    /** Available topping mixture */
    topMix: Mix;
}

export interface TopRequest {
    /** Tank start situation before mix */
    source: TankMix;
    /** Available topping mixture */
    topMix: TankMix;
}

/** Gas mix blending math */
export class GasBlender {
    /**
     * Calculates final pressure combining two tanks A and B with different volume and start pressure
     * using real gas compressibility.
     *
     * @returns final pressure in both tanks in bars
     */
    public static redundancies(tankA: TankFill, tankB: TankFill): number {
        GasBlender.validateTankFill(tankA, 'tankA');
        GasBlender.validateTankFill(tankB, 'tankB');

        if (tankA.size === 0 && tankB.size === 0) {
            return 0;
        }

        // prevents rounding issues
        if(tankA.size === tankB.size && tankA.startPressure === tankB.startPressure) {
            return tankA.startPressure;
        }

        // see https://thetheoreticaldiver.org/wordpress/index.php/2019/02/23/equalizing-real-gases/
        const gas = StandardGases.air; // consider make it configurable
        const compressibility = new Compressibility();
        const tankVolumeA = compressibility.tankVolume(tankA, gas);
        const tankVolumeB = compressibility.tankVolume(tankB, gas);
        const totalVolume = tankVolumeA + tankVolumeB;
        const combinedSize = tankA.size + tankB.size;
        const zFactorA = compressibility.zFactor(tankA.startPressure, gas);
        const zFactorB = compressibility.zFactor(tankB.startPressure, gas);
        const weigthedZfactor = (tankVolumeA * zFactorA + tankVolumeB * zFactorB) / totalVolume;
        const idealPressure =  totalVolume / combinedSize * weigthedZfactor;
        const zFactor = compressibility.zFactor(idealPressure, gas);
        const final = idealPressure * zFactor / weigthedZfactor;
        return final;
    }

    /**
     * Describes what happens, if you top up the source tank with topping mix.
     * Tank volume is not relevant here, since the topping and source tanks are the same size.
     */
    public static top(request: TopRequest): TankMix {
        GasBlender.validate(request.source, 'Source');
        GasBlender.validate(request.topMix, 'Target');

        const compressibility = new Compressibility();
        const sourceGas = new Gas(request.source.o2, request.source.he);
        const currentVolume = compressibility.normalVolume(request.source.pressure, sourceGas);
        const topGas = new Gas(request.topMix.o2, request.topMix.he);
        const topVolume = compressibility.normalVolume(request.topMix.pressure, topGas);
        const finalO2Volume = sourceGas.fO2 * currentVolume + topGas.fO2 * topVolume;
        const finalHeVolume = sourceGas.fHe * currentVolume + topGas.fHe * topVolume;
        const totalVolume = currentVolume + topVolume;
        const finalGas = new Gas(finalO2Volume / totalVolume, finalHeVolume / totalVolume);
        const finalPressure = compressibility.pressure(finalGas, totalVolume);

        if(finalPressure === 0) {
            return {
                o2: 0,
                he: 0,
                pressure: 0
            };
        }

        return {
            o2: finalGas.fO2,
            he: finalGas.fHe,
            pressure: finalPressure
        };
    }

    /**
     * Math describing to create required amount of mixture from current tank content using o2, he and topping mix.
     * The formula expects ideal gas law.
     * Result is guarantied with precision on 6 decimal places.
     */
    public static mix(request: MixRequest): MixResult {
        GasBlender.validate(request.source, 'Source');
        GasBlender.validate(request.target, 'Target');
        GasBlender.validate(request.topMix, 'Top');

        const finalfN2 = GasBlender.n2(request.target);
        const finalN2  = finalfN2 * request.target.pressure;
        const currentfN2 = GasBlender.n2(request.source);
        const currentN2 = currentfN2 * request.source.pressure;
        let addN2 = finalN2 - currentN2;
        addN2 = Precision.round(addN2, 8);

        // Even the top mix contains more nitrogen than target, we are still able to mix
        // by adding less top mix and more He and O2
        if(addN2 < 0) {
            const removeSource = -(addN2 / currentfN2);
            return GasBlender.mixByRemoving(request, removeSource);
        }

        const topfN2 = GasBlender.n2(request.topMix);
        const addTop = addN2 / topfN2;
        const targetHe = GasBlender.pressureHe(request.target);
        const sourceHe = GasBlender.pressureHe(request.source);
        const topHe = addTop * request.topMix.he;
        let addHe = targetHe - sourceHe - topHe;
        addHe = Precision.round(addHe, 8);

        if(addHe < 0) {
            const removeSource = -(addHe / request.source.he);
            return GasBlender.mixByRemoving(request, removeSource);
        }

        let addO2 = request.target.pressure - request.source.pressure - addHe - addTop;
        addO2 = Precision.round(addO2, 8);

        if(addO2 < 0) {
            const removeSource = -(addO2 / request.source.o2);
            return GasBlender.mixByRemoving(request, removeSource);
        }

        return {
            addO2: addO2,
            addHe: addHe,
            addTop: addTop,
            removeFromSource: 0
        };
    }

    private static mixByRemoving(request: MixRequest, removeSource: number) {
        const newRequest = GasBlender.copyRequest(request);
        // const expectedRemove = Precision.floor(removeSource, 8);

        if(removeSource > request.source.pressure) {
            throw new Error('Unable to mix required gas because target contains less he or oxygen than top mix.');
        }

        newRequest.source.pressure -= removeSource;
        const result =  GasBlender.mix(newRequest);
        // aggregate the removed pressure from all the recursive calls
        result.removeFromSource += removeSource;
        return result;
    }

    private static n2(mix: Mix): number {
        return 1 - mix.o2 - mix.he;
    }

    private static validate(mix: Mix, partName: string): void {
        if (mix.o2 < 0 || mix.o2 > 1) {
            throw new Error(`${partName} mix contains invalid o2 content. Needs to be in range 0-1.`);
        }

        if (mix.he < 0 || mix.he > 1) {
            throw new Error(`${partName} mix contains invalid he content. Needs to be in range 0-1.`);
        }

        const sum = mix.o2 + mix.he;
        if (sum > 1) {
            throw new Error(`${partName} mix contains invalid N2 content. Needs to be in range 0-1.`);
        }
    }

    private static validateTankFill(tank: TankFill, tankName: string): void {
        if (tank.size < 0) {
            throw new Error(`${tankName} Volume needs to be positive number.`);
        }

        if (tank.startPressure < 0) {
            throw new Error(`${tankName} Start pressure needs to be positive number.`);
        }
    }

    private static copyRequest(request: MixRequest): MixRequest {
        return {
            source: GasBlender.copyTankMix(request.source),
            target: GasBlender.copyTankMix(request.target),
            topMix: {
                o2: request.topMix.o2,
                he: request.topMix.he
            }
        };
    }

    private static copyTankMix(source: TankMix): TankMix {
        return {
            o2: source.o2,
            he: source.he,
            pressure: source.pressure
        };
    }

    private static pressureHe(tank: TankMix): number {
        return tank.he * tank.pressure;
    }
}
