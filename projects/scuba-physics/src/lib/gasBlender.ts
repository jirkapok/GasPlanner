export interface TankFill {
    /** start pressure in bars as non zero positive number.*/
    startPressure: number;
    /** internal tank water volume in liters as non zero positive number. */
    volume: number;
}

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

/** Gas mix blending math */
export class GasBlender {
    /**
     * Math describing to create required amount of mixture from current tank content using o2, he and topping mix.
     */
    public static mix(request: MixRequest): MixResult {
        GasBlender.validate(request.source, 'Source');
        GasBlender.validate(request.target, 'Target');
        GasBlender.validate(request.topMix, 'Top');

        const finalfN2 = GasBlender.n2(request.target);
        const finalN2  = finalfN2 * request.target.pressure;
        const currentfN2 = GasBlender.n2(request.source);
        const currentN2 = currentfN2 * request.source.pressure;
        const addN2 = finalN2 - currentN2;
        const topfN2 = GasBlender.n2(request.topMix);
        const addTop = addN2 / topfN2;
        const targetHe = request.target.pressure * request.target.he;
        const sourceHe = request.source.pressure * request.source.he;
        const topHe = addTop * request.topMix.he;

        const addHe = targetHe - sourceHe - topHe;
        const addO2 = request.target.pressure - request.source.pressure - addHe - addTop;

        return {
            addO2: addO2,
            addHe: addHe,
            addTop: addTop,
            removeFromSource: 0
        };
    }

    /**
     * Calculates final pressure combining two tanks A and B with different volume and start pressure using ideal gas law.
     *
     * @returns final pressure in both tanks in bars
     */
    public static redundancies(tankA: TankFill, tankB: TankFill): number {


        if (tankA.volume === 0 && tankB.volume === 0) {
            return 0;
        }

        const combinedVolume = tankA.volume + tankB.volume;
        const tankVolumeA = GasBlender.tankGasVolume(tankA);
        const tankVolumeB = GasBlender.tankGasVolume(tankB);
        const result = (tankVolumeA + tankVolumeB) / combinedVolume;
        return result;
    }

    private static tankGasVolume(tank: TankFill): number {
        return tank.startPressure * tank.volume;
    }

    private static n2(mix: Mix): number {
        return 1 - mix.o2 - mix.he;
    }

    private static validate(mix: Mix, partName: string): void {
        if (mix.o2 < 0 || mix.o2 > 1) {
            throw new Error(`${partName} mix contains invalid o2 content.`);
        }

        if (mix.he < 0 || mix.he > 1) {
            throw new Error(`${partName} mix contains invalid he content.`);
        }

        const sum = mix.o2 + mix.he;
        if (sum > 1) {
            throw new Error(`${partName} mix contains invalid N2 content.`);
        }
    }

    private static validateTankFill(tank: TankFill): void {
        if (tank.volume <= 0) {
            throw new Error('Tank Volume needs to be positive number.');
        }

        if (tank.startPressure <= 0) {
            throw new Error('Tank Start pressure needs to be positive number.');
        }
    }
}
