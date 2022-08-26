import { Salinity } from './pressure-converter';
import { Options, SafetyStop } from './Options';

export class OptionExtensions {
    public static createOptions(gfLow: number, gfHigh?: number, maxPpO2?: number, maxDecoPpO2?: number, salinity?: Salinity): Options {
        const options = new Options(gfLow, gfHigh, maxPpO2, maxDecoPpO2, salinity);
        OptionExtensions.applySimpleSpeeds(options);
        options.gasSwitchDuration = 1;
        return options;
    }

    public static applySimpleSpeeds(options: Options): void {
        options.ascentSpeed6m = 10;
        options.ascentSpeed50percTo6m = 10;
        options.ascentSpeed50perc = 10;
        options.descentSpeed = 20;
    }
}


describe('Options', () => {
    describe('LoadFrom', () => {
        it('applies 0 m altitude', () => {
            const sut = OptionExtensions.createOptions(1,1,1,1,Salinity.fresh);
            sut.altitude = 500;
            const modified = OptionExtensions.createOptions(1,1,1,1,Salinity.fresh);
            modified.altitude = 0;
            sut.loadFrom(modified);
            expect(sut).toEqual(modified);
        });

        it('applies all properties', () => {
            const sut = OptionExtensions.createOptions(0.3, 0.7, 1.1, 1.5, Salinity.salt);
            sut.altitude = 500;
            sut.ascentSpeed50perc = 4;
            sut.ascentSpeed50percTo6m = 5;
            sut.ascentSpeed6m = 7;
            sut.decoStopDistance = 5;
            sut.descentSpeed = 11;
            sut.gasSwitchDuration = 3;
            sut.lastStopDepth = 11;
            sut.maxEND = 31;
            sut.minimumAutoStopDepth = 12;
            sut.oxygenNarcotic = false;
            sut.problemSolvingDuration = 3;
            sut.roundStopsToMinutes = true;
            sut.safetyStop = SafetyStop.never;

            const modified = OptionExtensions.createOptions(1,1,1,1,Salinity.fresh);
            modified.loadFrom(sut);
            expect(sut).toEqual(modified);
        });
    });
});
