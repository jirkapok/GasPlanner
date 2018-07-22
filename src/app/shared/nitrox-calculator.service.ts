import { Injectable } from '@angular/core';

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
  private calculate: () => void = this.calculateMod;

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
        this.calculate = this.calculateMod;
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

  public get mod(): number {
    return this._mod;
  }

  public set mod(newValue: number) {
    this._mod = newValue;
    this.calculate();
  }

  private calculateMod() {
    const resultAtm = this._pO2 * 100 / this._fO2;
    const result = this.fromAtm(resultAtm);
    this._mod = Math.floor(result * 100) / 100;
  }

  private calculateBestMix() {
    const depthAtm = this.toAtm(this._mod);
    const result = this._pO2 * 100 / depthAtm;
    this._fO2 = Math.floor(result * 100) / 100;
  }

  private calculatePartial() {
    const depthAtm = this.toAtm(this._mod);
    const result = this._fO2 * depthAtm / 100;
    this._pO2 = Math.ceil(result * 100) / 100;
  }

  private toAtm(depth: number): number {
    return depth / 10 + 1;
  }

  private fromAtm(atm: number): number {
    return (atm - 1) * 10;
  }
}
