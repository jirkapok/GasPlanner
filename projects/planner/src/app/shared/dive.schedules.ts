import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import { Injectable } from '@angular/core';
import { DiveResults } from './diveresults';
import { DepthsService } from './depths.service';
import { ReloadDispatcher } from './reloadDispatcher';
import { GasToxicity } from 'scuba-physics';

export class DiveSchedule {
    private _id = 0;
    private _surfaceInterval = Number.POSITIVE_INFINITY;
    private readonly _diveResult = new DiveResults();
    private readonly _optionsService: OptionsService;
    private readonly _tanks: TanksService;
    private readonly _depths: DepthsService;

    constructor(index: number, private units: UnitConversion, private dispatcher: ReloadDispatcher) {
        this.assignIndex(index);
        this._tanks = new TanksService(units, dispatcher);
        this._optionsService = new OptionsService(this.units, this.dispatcher);
        this._depths = new DepthsService(this.units, this.tanksService, this._diveResult, this._optionsService, this.dispatcher);
    }

    public get id(): number {
        return this._id;
    }

    public get isFirst(): boolean {
        return this.id === 1;
    }

    public get surfaceInterval(): number {
        return this._surfaceInterval;
    }

    public get tanksService(): TanksService {
        return this._tanks;
    }

    public get diveResult(): DiveResults {
        return this._diveResult;
    }

    public get depths(): DepthsService {
        return this._depths;
    }

    public get optionsService(): OptionsService {
        return this._optionsService;
    }

    public get title(): string {
        const depth = this.depths.plannedDepth;
        const depthUnits = this.units.length;
        const duration = this.depths.planDuration;
        return `${this.id}. ${duration} min/${depth} ${depthUnits}`;
    }

    /**
     * Gets or sets number of seconds diver rested at surface from previous dive.
     * For first dive it is always POSITIVE_INFINITY.
     */
    public set surfaceInterval(newValue: number) {
        if(this.isFirst || newValue < 0) {
            return;
        }

        this._surfaceInterval = newValue;
    }

    public assignIndex(index: number): void {
        this._id = index + 1;
    }

    public applyNitrox(fO2: number, pO2: number): void {
        this.tanksService.firstTank.tank.o2 = fO2;
        this.optionsService.diverOptions.maxPpO2 = pO2;
    }

    public setSimple(): void {
        this.optionsService.resetToSimple();
        this.tanksService.resetToSimple();
        this.depths.setSimple();
    }
}

@Injectable()
export class DiveSchedules {
    private _dives: DiveSchedule[] = [];
    private _selected: DiveSchedule;

    constructor(private units: UnitConversion, private dispatcher: ReloadDispatcher) {
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

    public get selectedTansks(): TanksService {
        return this.selected.tanksService;
    }

    public get selectedResult(): DiveResults {
        return this.selected.diveResult;
    }

    public get selectedDepths(): DepthsService {
        return this.selected.depths;
    }

    public get selectedOptions(): OptionsService {
        return this.selected.optionsService;
    }

    public get selectedToxicity(): GasToxicity {
        return this.selected.optionsService.toxicity;
    }

    public set selected(newValue: DiveSchedule) {
        if (this._dives.includes(newValue)) {
            this._selected = newValue;
            this.dispatcher.sendSelectedChanged(newValue);
        }
    }

    public add(): DiveSchedule {
        const newDive = this.createDiveSchedule();
        this._dives.push(newDive);
        this._selected = newDive;
        return newDive;
    }

    public remove(dive: DiveSchedule): void {
        if (!this.empty) {
            this._dives = this._dives.filter(g => g !== dive);
            this.renumber();
            this._selected = this._dives[0];
        }
    }

    public clear(): void {
        // there should always be at least one dive
        this._dives.splice(1, this._dives.length);
    }

    /**
     * Since the View switch is global, we need to switch all dives.
     */
    public setSimple(): void {
        this._dives.forEach((dive) => {
            dive.setSimple();
        });
    }

    private createDiveSchedule(): DiveSchedule {
        return new DiveSchedule(this.length, this.units, this.dispatcher);
    }

    private renumber(): void {
        this._dives.forEach((dive, index) => {
            dive.assignIndex(index);
        });
    }
}
