import { Injectable } from '@angular/core';
import { NitroxCalculator, DepthConverter, DepthLevels } from 'scuba-physics';
import { OptionsDispatcherService } from './options-dispatcher.service';

export enum NitroxMode {
    Mod,
    BestMix,
    PO2
}

@Injectable({
    providedIn: 'root'
})
export class NitroxCalculatorService {
    private _pO2 = 1.6;
    private _fO2 = 50;
    private _mod = 22;
    private _calculation = NitroxMode.Mod;

    private nitroxCalculator: NitroxCalculator;

    constructor(options: OptionsDispatcherService) {
        const depthConverter = DepthConverter.simple();
        const depthLevels = new DepthLevels(depthConverter, options);
        this.nitroxCalculator = new NitroxCalculator(depthLevels, depthConverter);
    }

    public get calculation(): NitroxMode {
        return this._calculation;
    }

    public get pO2(): number {
        return this._pO2;
    }

    public get fO2(): number {
        return this._fO2;
    }

    public get ead(): number {
        return this.nitroxCalculator.ead(this._fO2, this._mod);
    }

    public get mod(): number {
        return this._mod;
    }

    public set calculation(newValue: NitroxMode) {
        this._calculation = newValue;

        switch (newValue) {
            case NitroxMode.BestMix:
                this.calculate = () => this.calculateBestMix();
                break;
            case NitroxMode.PO2:
                this.calculate = () => this.calculatePartial();
                break;
            default:
                this.calculate = () => this.calculateCurrentMod();
        }
    }

    public set pO2(newValue: number) {
        this._pO2 = newValue;
        this.calculate();
    }

    public set fO2(newValue: number) {
        this._fO2 = newValue;
        this.calculate();
    }

    public set mod(newValue: number) {
        this._mod = newValue;
        this.calculate();
    }

    private calculateCurrentMod = () => {
        this._mod = this.nitroxCalculator.mod(this._pO2, this._fO2);
    };

    private calculateBestMix = () => {
        this._fO2 = this.nitroxCalculator.bestMix(this._pO2, this._mod);
    };

    private calculatePartial = () => {
        this._pO2 = this.nitroxCalculator.partialPressure(this._fO2, this._mod);
    };

    private calculate = () => this.calculateCurrentMod();
}
