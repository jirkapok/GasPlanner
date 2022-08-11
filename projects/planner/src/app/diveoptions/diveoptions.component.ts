import { Component, Input } from '@angular/core';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { SafetyStop } from 'scuba-physics';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { Plan, Strategies } from '../shared/models';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

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
    public readonly safetyOffName = 'Never';
    public readonly safetyOnName = 'Always';
    public plan: Plan;
    public strategy = this.allUsableName;
    public icon = faCog;

    constructor(public units: UnitConversion,
        public options: OptionsDispatcherService,
        private planner: PlannerService,
        private delayedCalc: DelayedScheduleService) {
        this.plan = this.planner.plan;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get safetyAutoName(): string {
        const level = this.units.autoStopLevel;
        return `Auto (> ${level} ${this.units.length})`;
    }

    public get safetyStopOption(): string {
        switch(this.options.safetyStop){
            case SafetyStop.never:
                return this.safetyOffName;
            case SafetyStop.always:
                return this.safetyOnName;
            default:
                return this.safetyAutoName;
        }
    }

    public set isComplex(newValue: boolean) {
        this.planner.isComplex = newValue;

        if (!this.planner.isComplex) {
            this.setAllUsable();
            this.options.resetToSimple();
            this.planner.resetToSimple();
            // no need to recalculate in simple mode, since there are no data changes
            this.applyOptions();
        }
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

    public allUsable(): void {
        this.setAllUsable();
        this.applyOptions();
    }

    public setAllUsable(): void {
        this.plan.strategy = Strategies.ALL;
        this.strategy = this.allUsableName;
    }

    public halfUsable(): void {
        this.plan.strategy = Strategies.HALF;
        this.strategy = this.halfUsableName;
        this.applyOptions();
    }

    public thirdUsable(): void {
        this.plan.strategy = Strategies.THIRD;
        this.strategy = this.thirdUsableName;
        this.applyOptions();
    }

    public useRecreational(): void {
        this.options.useRecreational();
        this.applyOptions();
    }

    public useRecommended(): void {
        this.options.useRecommended();
        this.applyOptions();
    }

    public switchStopsRounding(): void {
        this.options.roundStopsToMinutes = !this.options.roundStopsToMinutes;
        this.applyOptions();
    }

    public useSafetyOff(): void {
        this.options.useSafetyOff();
        this.applyOptions();
    }

    public useSafetyAuto(): void {
        this.options.useSafetyAuto();
        this.applyOptions();
    }
    public useSafetyOn(): void {
        this.options.useSafetyOn();
        this.applyOptions();
    }

    public switchOxygenNarcotic(): void {
        this.options.oxygenNarcotic = !this.options.oxygenNarcotic;
        this.applyOptions();
    }

    public applyOptions(): void {
        this.planner.assignOptions(this.options.getOptions());
        this.delayedCalc.schedule();
    }
}
