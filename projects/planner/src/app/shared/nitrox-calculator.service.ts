import { Injectable } from '@angular/core';
import { NitroxCalculator, DepthConverter } from 'scuba-physics';

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
  private _mod = 22.43;
  private _calculation = NitroxMode.Mod;
  private calculate: () => void = this.calculateCurrentMod;

  public get calculation(): NitroxMode {
    return this._calculation;
  }

  public set calculation(newValue: NitroxMode) {
    this._calculation = newValue;

    switch (newValue) {
      case NitroxMode.BestMix:
        this.calculate = this.calculateBestMix;
        break;
      case NitroxMode.PO2:
        this.calculate = this.calculatePartial;
        break;
      default:
        this.calculate = this.calculateCurrentMod;
    }
  }

  public get pO2(): number {
    return this._pO2;
  }

  public set pO2(newValue: number) {
    this._pO2 = newValue;
    this.calculate();
  }

  public get fO2(): number {
    return this._fO2;
  }

  public set fO2(newValue: number) {
    this._fO2 = newValue;
    this.calculate();
  }

  public get ead(): number {
    return NitroxCalculator.ead(this._fO2, this._mod);
  }

  public get mod(): number {
    return this._mod;
  }

  public set mod(newValue: number) {
    this._mod = newValue;
    this.calculate();
  }

  private calculateCurrentMod() {
    this._mod = new NitroxCalculator(DepthConverter.forFreshWater())
                     .mod(this._pO2, this._fO2);
  }

  private calculateBestMix() {
    this._fO2 = NitroxCalculator.bestMix(this._pO2, this._mod);
  }

  private calculatePartial() {
    this._pO2 = NitroxCalculator.partialPressure(this._fO2, this._mod);
  }
}
