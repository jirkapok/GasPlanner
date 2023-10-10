import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';

export class DiveSchedule {
    /** In minutes or undefined in case it is the first dive */
    public surfaceInterval?: number;
    private optionsService: OptionsService;
    private _tanks: TanksService;
    private plan: Plan = new Plan(); // Depths service

    constructor(private units: UnitConversion) {
        this._tanks = new TanksService(units);
        this.optionsService = new OptionsService(this.units);

        // this enforces to initialize the levels, needs to be called after subscribe to plan
        if (this.plan.maxDepth === 0) {
            let requiredDepth = this.units.defaults.stopsDistance * 10; // 30 m or 100 ft
            requiredDepth = this.units.toMeters(requiredDepth);
            const firstTank = this.firstTank;
            const options = this.optionsService.getOptions();
            this.plan.setSimple(requiredDepth, 12, firstTank, options);
        }
    }

    public get title(): string {
        return `${this.plan.duration} min/${this.plan.maxDepth} m`;
    }

    private get firstTank(): Tank {
        return this._tanks.firstTank.tank;
    }
}

export class DivesSchedule {
    private _dives: DiveSchedule[] = [];

    constructor(private units: UnitConversion) {
        this.add();
    }

    public get dives(): DiveSchedule[] {
        return this._dives.slice();
    }

    public add(): void {
        const newDive = this.createDiveSchedule();
        this._dives.push(newDive);
    }

    public remove(dive: DiveSchedule): void {
        this._dives = this._dives.filter(g => g !== dive);
    }

    private createDiveSchedule(): DiveSchedule {
        return new DiveSchedule(this.units);
    }
}
