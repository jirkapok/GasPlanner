import { Injectable } from '@angular/core';
import { SacCalculator, DepthConverterFactory, DepthOptions } from 'scuba-physics';

export enum SacMode {
    sac = 0,
    used = 1,
    duration = 2
}

@Injectable({
    providedIn: 'root'
})
export class SacCalculatorService {
    private _depth = 15;
    private _tank = 15;
    private _used = 150;
    private _duration = 45;
    private _sac = 0;
    private sacCalculator: SacCalculator;
    private _calculation = SacMode.sac;
    private calculate: () => void = this.calculateSac;
    private options: DepthOptions = {
        isFreshWater: true,
        altitude: 0
    };

    private depthConverterFactory = new DepthConverterFactory(this.options);

    constructor() {
        const depthConverter = this.depthConverterFactory.create();
        this.sacCalculator = new SacCalculator(depthConverter);
        this.calculate();
    }

    public get depth(): number {
        return this._depth;
    }

    public set depth(newValue: number) {
        this._depth = newValue;
        this.calculate();
    }

    public get tank(): number {
        return this._tank;
    }

    public set tank(newValue: number) {
        this._tank = newValue;
        this.calculate();
    }

    public get sac(): number {
        return this._sac;
    }

    public set sac(newValue: number) {
        this._sac = newValue;
        this.calculate();
    }

    public get duration(): number {
        return this._duration;
    }

    public set duration(newValue: number) {
        this._duration = newValue;
        this.calculate();
    }

    public get used(): number {
        return this._used;
    }

    public set used(newValue: number) {
        this._used = newValue;
        this.calculate();
    }

    public get calculation(): SacMode {
        return this._calculation;
    }

    public set calculation(newValue: SacMode) {
        this._calculation = newValue;

        switch (newValue) {
            case SacMode.duration:
                this.calculate = this.calculateDuration;
                break;
            case SacMode.used:
                this.calculate = this.calculateUsed;
                break;
            default:
                this.calculate = this.calculateSac;
        }
    }

    private calculateSac(): void {
        this._sac = this.sacCalculator.calculateSac(this.depth, this.tank, this.used, this.duration);
    }

    private calculateDuration(): void {
        this._duration = this.sacCalculator.calculateDuration(this.depth, this.tank, this.used, this.sac);
    }

    private calculateUsed(): void {
        this._used = this.sacCalculator.calculateUsed(this.depth, this.tank, this.duration, this.sac);
    }
}
