import { Component, OnInit, Input } from '@angular/core';
import { faCog } from '@fortawesome/free-solid-svg-icons';

import { Diver } from 'scuba-physics';
import { Plan, Strategies } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

@Component({
    selector: 'app-diveoptions',
    templateUrl: './diveoptions.component.html',
    styleUrls: ['./diveoptions.component.css']
})
export class DiveOptionsComponent implements OnInit {
    @Input()
    public formValid = true;

    public readonly allUsableName = 'All usable';
    public readonly halfUsableName = 'Half usable';
    public readonly thirdUsableName = 'Thirds usable';
    public readonly lowName = 'Low (45/95)';
    public readonly mediumName = 'Medium (40/85)';
    public readonly highName = 'High (30/75)';
    public conservatism = this.mediumName;
    public plan: Plan;
    public strategy = this.allUsableName;
    public icon = faCog;


    constructor(private planner: PlannerService) {
        this.plan = this.planner.plan;
    }

    ngOnInit(): void {
        this.reset();
    }

    public reset(): void {
        switch (this.plan.strategy) {
            case Strategies.HALF: {
                this.halfUsable();
                break;
            }
            case Strategies.THIRD: {
                this.thirdUsable();
                break;
            }
            default: {
                this.allUsable();
                break;
            }
        }
    }

    public lowConservatism(): void {
        this.conservatism = this.lowName;
        this.plannedGfLow = 45;
        this.plannedGfHigh = 95;
    }

    public mediumConservatism(): void {
        this.conservatism = this.mediumName;
        this.plannedGfLow = 40;
        this.plannedGfHigh = 85;
    }

    public highConservatism(): void {
        this.conservatism = this.highName;
        this.plannedGfLow = 30;
        this.plannedGfHigh = 75;
    }

    public allUsable(): void {
        this.setAllUsable();
        this.planner.calculate();
    }

    public setAllUsable(): void {
        this.plan.strategy = Strategies.ALL;
        this.strategy = this.allUsableName;
    }

    public halfUsable(): void {
        this.plan.strategy = Strategies.HALF;
        this.strategy = this.halfUsableName;
        this.planner.calculate();
    }

    public thirdUsable(): void {
        this.plan.strategy = Strategies.THIRD;
        this.strategy = this.thirdUsableName;
        this.planner.calculate();
    }

    @Input()
    public get plannedDepth(): number {
        return this.plan.depth;
    }

    public set plannedDepth(depth: number) {
        this.plan.depth = depth;
        this.planner.calculate();
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public set isComplex(newValue: boolean) {
        this.planner.isComplex = newValue;

        if (!this.planner.isComplex) {
            this.setAllUsable();
            this.mediumConservatism();
            this.setAscentSpeed(Diver.ascSpeed);
            this.setDescentSpeed(Diver.descSpeed);
            this.setRoundDecoStops(true);
            this.setSafetyStopEnabled(true);
            this.setGasSwitchDuration(1);
            this.planner.resetToDefaultGases();
        }

        this.planner.calculate();
    }

    private setRoundDecoStops(newValue: boolean): void {
        this.planner.options.roundStopsToMinutes = newValue;
    }

    public get roundDecoStops(): boolean {
        return this.planner.options.roundStopsToMinutes;
    }

    public set roundDecoStops(newValue: boolean) {
        this.setRoundDecoStops(newValue);
        this.planner.calculate();
    }

    private setGasSwitchDuration(newValue: number): void {
        this.planner.options.gasSwitchDuration = newValue;
    }

    public get gasSwitchDuration(): number {
        return this.planner.options.gasSwitchDuration;
    }

    public set gasSwitchDuration(newValue: number) {
        this.setGasSwitchDuration(newValue);
        this.planner.calculate();
    }

    public get plannedGfHigh(): number {
        return this.planner.options.gfHigh * 100;
    }

    public set plannedGfHigh(newValue: number) {
        this.planner.options.gfHigh = newValue / 100;
        this.planner.calculate();
    }

    public get plannedGfLow(): number {
        return this.planner.options.gfLow * 100;
    }

    public set plannedGfLow(newValue: number) {
        this.planner.options.gfLow = newValue / 100;
        this.planner.calculate();
    }

    public get isFreshWater(): boolean {
        return this.planner.options.isFreshWater;
    }

    public set isFreshWater(newValue: boolean) {
        this.planner.changeWaterType(newValue);
    }

    private setSafetyStopEnabled(newValue: boolean): void {
        this.planner.options.addSafetyStop = newValue;
    }

    public get safetyStopEnabled(): boolean {
        return this.planner.options.addSafetyStop;
    }

    public set safetyStopEnabled(newValue: boolean) {
        this.setSafetyStopEnabled(newValue);
        this.planner.calculate();
    }

    public get plannedAltitude(): number {
        return this.planner.options.altitude;
    }

    public set plannedAltitude(newValue: number) {
        this.planner.options.altitude = newValue;
        this.planner.calculate();
    }

    private setAscentSpeed(newValue: number) {
        this.planner.options.ascentSpeed = newValue;
    }

    public get ascentSpeed(): number {
        return this.planner.options.ascentSpeed;
    }

    public set ascentSpeed(newValue: number) {
        this.setAscentSpeed(newValue);
        this.planner.calculate();
    }

    private setDescentSpeed(newValue: number) {
        this.planner.options.descentSpeed = newValue;
    }

    public get descentSpeed(): number {
        return this.planner.options.descentSpeed;
    }

    public set descentSpeed(newValue: number) {
        this.setDescentSpeed(newValue);
        this.planner.calculate();
    }


}
