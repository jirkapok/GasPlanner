import { Tank } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';
import { Injectable } from '@angular/core';

export class DiveSchedule {
    /** In minutes or undefined in case it is the first dive */
    public surfaceInterval?: number;
    private optionsService: OptionsService;
    private _tanks: TanksService;
    private plan: Plan = new Plan(); // Depths service

    constructor(private units: UnitConversion) {
        this._tanks = new TanksService(units);
        this.optionsService = new OptionsService(this.units);

        // TODO load from default dive
        // this enforces to initialize the levels, needs to be called after subscribe to plan
        if (this.plan.maxDepth === 0) {
            let requiredDepth = this.units.defaults.stopsDistance * 10; // 30 m or 100 ft
            requiredDepth = this.units.toMeters(requiredDepth);
            const firstTank = this.firstTank;
            const options = this.optionsService.getOptions();
            this.plan.setSimple(requiredDepth, 12, firstTank, options);
        }
    }

    // TODO add dive number
    // TODO add load/save preferences
    // TODO planner needs to recalculate line after dive is added or removed
    public get title(): string {
        const depth = this.units.fromMeters(this.plan.maxDepth);
        const depthUnits = this.units.length;
        const duration = this.plan.duration;
        return `${duration} min/${depth} ${depthUnits}`;
    }

    private get firstTank(): Tank {
        return this._tanks.firstTank.tank;
    }
}

@Injectable()

export class DivesSchedule {
    private _dives: DiveSchedule[] = [];
    private _selected: DiveSchedule;

    constructor(private units: UnitConversion) {
        this.add();
        this._selected = this._dives[0];
    }

    public get dives(): DiveSchedule[] {
        return this._dives.slice();
    }

    public get selected(): DiveSchedule {
        return this._selected;
    }

    public get length(): number {
        return this._dives.length;
    }

    public get empty(): boolean {
        return this.length <= 1;
    }

    public set selected(newValue: DiveSchedule) {
        if (this._dives.includes(newValue)) {
            this._selected = newValue;
        }
    }

    public add(): void {
        const newDive = this.createDiveSchedule();
        this._dives.push(newDive);
        this._selected = newDive;
    }

    public remove(dive: DiveSchedule): void {
        if (!this.empty) {
            this._dives = this._dives.filter(g => g !== dive);
            this._selected = this._dives[0];
        }
    }

    private createDiveSchedule(): DiveSchedule {
        return new DiveSchedule(this.units);
    }
}
