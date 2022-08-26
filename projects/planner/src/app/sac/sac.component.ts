import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService, SacMode } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver } from 'scuba-physics';

@Component({
    selector: 'app-sac',
    templateUrl: './sac.component.html',
    styleUrls: ['./sac.component.css']
})
export class SacComponent {
    public calcIcon = faCalculator;

    constructor(
        private router: Router, private planer: PlannerService,
        private calc: SacCalculatorService, public units: UnitConversion) {
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get inDuration(): boolean {
        return this.calc.calculation === SacMode.duration;
    }

    public get inUsed(): boolean {
        return this.calc.calculation === SacMode.used;
    }

    public get inSac(): boolean {
        return this.calc.calculation === SacMode.sac;
    }

    public get calcDepth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get calcTank(): number {
        return this.units.fromLiter(this.calc.tank);
    }

    public get calcUsed(): number {
        return this.units.fromBar(this.calc.used);
    }

    public get calcRmv(): number {
        return this.units.fromLiter(this.calc.rmv);
    }

    public get calcDuration(): number {
        return this.calc.duration;
    }

    public set calcDepth(newValue: number) {
        this.calc.depth = this.units.toMeters(newValue);
    }

    public set calcTank(newValue: number) {
        this.calc.tank = this.units.toLiter(newValue);
    }

    public set calcUsed(newValue: number) {
        this.calc.used = this.units.toBar(newValue);
    }

    public set calcRmv(newValue: number) {
        this.calc.rmv = this.units.toLiter(newValue);
    }

    public set calcDuration(newValue: number) {
        this.calc.duration = newValue;
    }

    public toDuration(): void {
        this.calc.calculation = SacMode.duration;
    }

    public toUsed(): void {
        this.calc.calculation = SacMode.used;
    }

    public toSac(): void {
        this.calc.calculation = SacMode.sac;
    }

    public async goBack(): Promise<boolean>  {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        this.planer.diver.rmv = this.calc.rmv;
    }

    public gasSac(): number {
        const sac = Diver.gasSac(this.calc.rmv, this.calc.tank);
        return this.units.fromLiter(sac);
    }
}
