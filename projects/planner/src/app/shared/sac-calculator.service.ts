import { Injectable } from '@angular/core';
import { SacCalculator, DepthConverter } from 'scuba-physics';

@Injectable()
export class SacCalculatorService {
    private _depth = 15;
    private _tank = 15;
    private _used = 150;
    private _duration = 45;
    private _rmv = 0;
    private sacCalculator: SacCalculator;
    private calculate: () => void;

    constructor() {
        const depthConverter = DepthConverter.simple();
        this.sacCalculator = new SacCalculator(depthConverter);
        this.calculate = this.calculateSac;
        this.calculate();
    }

    public get depth(): number {
        return this._depth;
    }

    public get tankSize(): number {
        return this._tank;
    }

    public get rmv(): number {
        return this._rmv;
    }

    public get duration(): number {
        return this._duration;
    }

    public get used(): number {
        return this._used;
    }

    public get inDuration(): boolean {
        return this.calculate === this.calculateDuration;
    }

    public get inUsed(): boolean {
        return this.calculate === this.calculateUsed;
    }

    public get inSac(): boolean {
        return this.calculate === this.calculateSac;
    }

    public set depth(newValue: number) {
        this._depth = newValue;
        this.calculate();
    }

    public set tankSize(newValue: number) {
        this._tank = newValue;
        this.calculate();
    }

    public set rmv(newValue: number) {
        this._rmv = newValue;
        this.calculate();
    }

    public set duration(newValue: number) {
        this._duration = newValue;
        this.calculate();
    }

    public set used(newValue: number) {
        this._used = newValue;
        this.calculate();
    }

    public toDuration(): void {
        this.calculate = this.calculateDuration;
    }

    public toUsed(): void {
        this.calculate = this.calculateUsed;
    }

    public toSac(): void {
        this.calculate = this.calculateSac;
    }

    private calculateSac(): void {
        this._rmv = this.sacCalculator.calculateSac(this.depth, this.tankSize, this.used, this.duration);
    }

    private calculateDuration(): void {
        this._duration = this.sacCalculator.calculateDuration(this.depth, this.tankSize, this.used, this.rmv);
    }

    private calculateUsed(): void {
        this._used = this.sacCalculator.calculateUsed(this.depth, this.tankSize, this.duration, this.rmv);
    }
}
