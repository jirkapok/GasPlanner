export interface TankFill {
    /** start pressure in bars as non zero positive number.*/
    startPressure: number;
    /** internal tank water volume in liters as non zero positive number. */
    volume: number;
}

export interface MixProcess {
    addO2: number;
    addTop: number;
}


export interface TankMix extends Mix {
    pressure: number;
}

export interface Mix {
    o2: number;
    he: number;
}

export interface MixRequest {
    source: TankMix;
    target: TankMix;
    topMix: Mix;
    useO2: boolean;
    useHe: boolean;
}

export class GasBlender {
    public static mix(request: MixRequest): MixProcess {
        const o2diff = request.target.o2 - request.topMix.o2;
        const topNitrox = 1 - request.topMix.o2;
        const addO2 = request.target.pressure * o2diff / topNitrox;
        let addTop = request.target.pressure - addO2 - request.source.pressure;

        if (addO2 < 0) {
            addTop = 0;
        }

        return {
            addO2: addO2,
            addTop: addTop
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
}
