import {
    AltitudePressure, PressureConverter
} from './pressure-converter';


/** Inspired by https://www.divebuddy.com/calculator/ */
export class AltitudeCalculator {
    public altitudeDepth = 20;
    private _altitude = 300;
    private _pressure = this.toPressure(this.altitude);

    public get pressure(): number {
        return this._pressure;
    }

    /** In m.a.s.l */
    public get altitude(): number {
        return this._altitude;
    }

    /** Expecting the altitudeDepth to be in fresh water meters */
    public get theoreticalDepth(): number {
        // targeting sea level pressure, because tables are calculated to sea level
        const ratio = AltitudePressure.standard / this.pressure;
        const targetDepth = this.altitudeDepth * ratio;
        return targetDepth;
    }

    public set pressure(newValue: number) {
        this._pressure = newValue;
        this._altitude = this.toAltitude(newValue);
    }

    public set altitude(newValue: number) {
        this._altitude = newValue;
        this._pressure = this.toPressure(newValue);
    }

    private toAltitude(pressure: number): number {
        const pascalPressure = PressureConverter.barToPascal(pressure);
        return AltitudePressure.altitude(pascalPressure);
    }

    private toPressure(altitude: number): number {
        const pressure = AltitudePressure.pressure(altitude);
        return PressureConverter.pascalToBar(pressure);
    }
}
