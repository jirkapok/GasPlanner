
export interface TankFill {
    /** start pressure in bars as non zero positive number.*/
    startPressure: number;
    /** internal tank water volume in liters as non zero positive number. */
    volume: number;
}

export class GasBlender {
    /**
     * Calculates final pressure combining two tanks A and B with different volume and start pressure using ideal gas law.
     *
     * @returns final pressure in both tanks in bars
     */
    public static redundancies(tankA: TankFill, tankB: TankFill): number {
        if(tankA.volume === 0 && tankB.volume === 0) {
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
