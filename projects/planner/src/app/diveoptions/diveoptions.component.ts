import { Component, Input } from '@angular/core';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { OptionDefaults } from 'scuba-physics';
import { Plan, Strategies } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

@Component({
    selector: 'app-diveoptions',
    templateUrl: './diveoptions.component.html',
    styleUrls: ['./diveoptions.component.css']
})
export class DiveOptionsComponent {
    @Input()
    public formValid = true;

    public readonly allUsableName = 'All usable';
    public readonly halfUsableName = 'Half usable';
    public readonly thirdUsableName = 'Thirds usable';
    public readonly lowName = 'Low (45/95)';
    public readonly mediumName = 'Medium (40/85)';
    public readonly highName = 'High (30/75)';
    public readonly freshName = 'Fresh';
    public readonly brackishName = 'Brackish (EN13319)';
    public readonly saltName = 'Salt';
    public conservatism = this.mediumName;
    public plan: Plan;
    public strategy = this.allUsableName;
    public icon = faCog;


    constructor(private planner: PlannerService) {
        this.plan = this.planner.plan;
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
        this.setMediumConservatism();
        this.planner.setMediumConservatism();
        this.planner.calculate();
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

    public useRecreational(): void {
        this.mediumConservatism();
        OptionDefaults.useRecreational(this.planner.options);
        this.planner.calculate();
    }

    public useRecommended(): void {
        this.mediumConservatism();
        OptionDefaults.useRecommended(this.planner.options);
        this.planner.calculate();
    }

    public salinityOption: string = "Fresh";

    public useFresh(): void {
        // TODO switch the underlying value
        this.salinityOption = this.freshName;
    }

    public useBrackish(): void {
        this.salinityOption = this.brackishName;
    }

    public useSalt(): void {
        this.salinityOption = this.saltName;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public set isComplex(newValue: boolean) {
        this.planner.isComplex = newValue;

        if (!this.planner.isComplex) {
            this.setAllUsable();
            this.setMediumConservatism();
            this.planner.resetToSimple();
        }

        this.planner.calculate();
    }

    private setMediumConservatism(): void {
        this.conservatism = this.mediumName;
    }

    public get roundDecoStops(): boolean {
        return this.planner.options.roundStopsToMinutes;
    }

    public set roundDecoStops(newValue: boolean) {
        this.planner.options.roundStopsToMinutes = newValue;
        this.planner.calculate();
    }

    public get gasSwitchDuration(): number {
        return this.planner.options.gasSwitchDuration;
    }

    public set gasSwitchDuration(newValue: number) {
        this.planner.options.gasSwitchDuration = newValue;
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

    public get safetyStopEnabled(): boolean {
        return this.planner.options.addSafetyStop;
    }

    public set safetyStopEnabled(newValue: boolean) {
        this.planner.options.addSafetyStop = newValue;
        this.planner.calculate();
    }

    public get plannedAltitude(): number {
        return this.planner.options.altitude;
    }

    public set plannedAltitude(newValue: number) {
        this.planner.options.altitude = newValue;
        this.planner.calculate();
    }

    public get ascentSpeed50perc(): number {
        return this.planner.options.ascentSpeed50perc;
    }

    public set ascentSpeed50perc(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.planner.options.ascentSpeed50perc = newValue;
        this.planner.calculate();
    }

    public get ascentSpeed50percTo6m(): number {
        return this.planner.options.ascentSpeed50percTo6m;
    }

    public set ascentSpeed50percTo6m(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.planner.options.ascentSpeed50percTo6m = newValue;
        this.planner.calculate();
    }

    public get ascentSpeed6m(): number {
        return this.planner.options.ascentSpeed6m;
    }

    public set ascentSpeed6m(newValue: number) {
        // somehow noticed frozen UI in case copy/paste 0 into the asc/desc fields
        if (newValue < 1) {
            return;
        }

        this.planner.options.ascentSpeed6m = newValue;
        this.planner.calculate();
    }

    public get descentSpeed(): number {
        return this.planner.options.descentSpeed;
    }

    public set descentSpeed(newValue: number) {
        if (newValue < 1) {
            return;
        }

        this.planner.options.descentSpeed = newValue;
        this.planner.calculate();
    }
}
