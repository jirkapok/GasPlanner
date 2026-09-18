import { TankFill } from '../consumption/Tanks';
import { Precision } from '../common/precision';
import { Compressibility } from '../physics/compressibility';
import { StandardGases } from '../gases/StandardGases';
import { Gas } from '../gases/Gases';
import { GasMixtures } from '../gases/GasMixtures';

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
    /** Below this threshold a volume/pressure difference is treated as real-gas solver noise and snapped to 0. */
    private static readonly precision = 0.000001;

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
     * Math describing how to create a required mixture from current tank content using O2, He and topping mix.
     * Gas quantities are calculated as normal volumes and converted to pressure changes for each fill step.
     * Result is guarantied with precision on 5 decimal places.
     */
    public static mix(request: MixRequest): MixResult {
        GasBlender.validate(request.source, 'Source');
        GasBlender.validate(request.target, 'Target');
        GasBlender.validate(request.topMix, 'Top');

        const compressibility = new Compressibility();
        const targetGas = new Gas(request.target.o2, request.target.he);
        const targetVolume = compressibility.normalVolume(request.target.pressure, targetGas);
        const initialGas = new Gas(request.source.o2, request.source.he);
        const sourceVolume = compressibility.normalVolume(request.source.pressure, initialGas);

        const finalfN2 = GasBlender.fN2(request.target);
        const finalN2Volume = finalfN2 * targetVolume;
        const currentfN2 = GasBlender.fN2(request.source);
        const currentN2Volume = currentfN2 * sourceVolume;
        const addN2Volume = GasBlender.cleanDifference(
            Precision.round(finalN2Volume - currentN2Volume, 8)
        );

        // Even the top mix contains more nitrogen than target, we are still able to mix
        // by adding less top mix and more He and O2
        if(addN2Volume < 0) {
            const removeSourceVolume = -(addN2Volume / currentfN2);
            return GasBlender.mixByRemovingVolume(compressibility, request, removeSourceVolume);
        }

        const topfN2 = GasBlender.fN2(request.topMix);
        const addTopVolume = addN2Volume / topfN2;
        const targetHeVolume = request.target.he * targetVolume;
        const sourceHeVolume = request.source.he * sourceVolume;
        const topHeVolume = addTopVolume * request.topMix.he;
        const addHeVolume = GasBlender.cleanDifference(
            Precision.round(targetHeVolume - sourceHeVolume - topHeVolume, 8)
        );

        if(addHeVolume < 0) {
            const removeSourceVolume = -(addHeVolume / request.source.he);
            return GasBlender.mixByRemovingVolume(compressibility, request, removeSourceVolume);
        }

        const addO2Volume = GasBlender.cleanDifference(
            Precision.round(targetVolume - sourceVolume - addHeVolume - addTopVolume, 8)
        );

        if(addO2Volume < 0) {
            const removeSourceVolume = -(addO2Volume / request.source.o2);
            return GasBlender.mixByRemovingVolume(compressibility, request, removeSourceVolume);
        }

        const volumeAfterHe = sourceVolume + addHeVolume;
        const volumeAfterO2 = sourceVolume + addHeVolume + addO2Volume;
        const pressureAfterHe = GasBlender.pressureForVolume(
            compressibility,
            volumeAfterHe,
            request.source.o2 * sourceVolume,
            request.source.he * sourceVolume + addHeVolume
        );
        const pressureAfterO2 = GasBlender.pressureForVolume(
            compressibility,
            volumeAfterO2,
            request.source.o2 * sourceVolume + addO2Volume,
            request.source.he * sourceVolume + addHeVolume
        );

        return {
            addO2: GasBlender.cleanDifference(pressureAfterO2 - pressureAfterHe),
            addHe: GasBlender.cleanDifference(pressureAfterHe - request.source.pressure),
            addTop: GasBlender.cleanDifference(request.target.pressure - pressureAfterO2),
            removeFromSource: 0
        };
    }

    private static mixByRemovingVolume(compressibility: Compressibility, request: MixRequest,
        removeSourceVolume: number): MixResult {
        const newRequest = GasBlender.copyRequest(request);
        const sourceGas = new Gas(request.source.o2, request.source.he);
        const sourceVolume = compressibility.normalVolume(request.source.pressure, sourceGas);

        if(removeSourceVolume > sourceVolume) {
            throw new Error('Unable to mix required gas because target contains less he or oxygen than top mix.');
        }

        newRequest.source.pressure = compressibility.pressure(sourceGas, sourceVolume - removeSourceVolume);
        const result =  GasBlender.mix(newRequest);
        result.removeFromSource += request.source.pressure - newRequest.source.pressure;
        return result;
    }

    private static pressureForVolume(compressibility: Compressibility, volume: number,
        o2Volume: number, heVolume: number): number {
        if (volume === 0) {
            return 0;
        }

        const gas = new Gas(o2Volume / volume, heVolume / volume);
        return compressibility.pressure(gas, volume);
    }

    private static cleanDifference(difference: number): number {
        return Math.abs(difference) < GasBlender.precision ? 0 : difference;
    }

    private static fN2(mix: Mix): number {
        return GasMixtures.n2(mix.o2, mix.he);
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
}
