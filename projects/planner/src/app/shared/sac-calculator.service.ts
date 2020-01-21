import { Injectable } from '@angular/core';
import { DepthConverterService } from 'scuba-physics';

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
  private _calculation = SacMode.sac;
  private calculate: () => void = this.calculateSac;

  constructor (){
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
    const bars = DepthConverterService.toBar(this.depth);
    const result = this.tank * this.used / this.duration / bars;
    this._sac = Math.ceil(result * 100) / 100;
  }

  private calculateDuration(): void {
    const bars = DepthConverterService.toBar(this.depth);
    const result = this.tank * this.used / this._sac / bars;
    this._duration = Math.ceil(result);
  }

  private calculateUsed(): void {
    const bars = DepthConverterService.toBar(this.depth);
    const result = this.duration * bars * this.sac / this.tank;
    this._used = Math.ceil(result);
  }
}
