import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import { Injectable } from '@angular/core';
import { DiveResults } from './diveresults';
import { DepthsService } from './depths.service';
import { ReloadDispatcher } from './reloadDispatcher';
import { GasToxicity, Time } from 'scuba-physics';
import _ from 'lodash';
import { DateFormats } from './formaters';

export class DiveSchedule {
    private _id = 0;
    private _surfaceInterval = Number.POSITIVE_INFINITY;
    private readonly _diveResult = new DiveResults();
    private readonly _optionsService: OptionsService;
    private readonly _tanks: TanksService;
    private readonly _depths: DepthsService;

    constructor(private _index: number, private units: UnitConversion, private dispatcher: ReloadDispatcher) {
        this.assignIndex(_index);
        this._tanks = new TanksService(units, dispatcher);
        this._optionsService = new OptionsService(this.units, this.dispatcher);
        this._depths = new DepthsService(this.units, this.tanksService, this._diveResult, this._optionsService, this.dispatcher);
    }

    public get index(): number {
        return this._index;
    }

    public get id(): number {
        return this._id;
    }

    /**
     * In meaning first in collection of dives.
     * Distinguish from primary property.
     */
    public get isFirst(): boolean {
        return this.id === 1;
    }

    public get surfaceInterval(): number {
        return this._surfaceInterval;
    }

    public get surfaceIntervalText(): string | null {
        if(this.primary) {
            return null;
        }

        return DateFormats.formatShortTime(this.surfaceInterval);
    }

    /**
     * It is the first dive of the day, e.g. it is not repetitive dive.
     * Distinguish from isFirst property.
     */
    public get primary(): boolean {
        return this.surfaceInterval === Number.POSITIVE_INFINITY;
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
        return `${this.id}. ${depth} ${depthUnits}, ${duration} min`;
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
        this.dispatcher.sendDepthChanged();
    }

    public assignIndex(index: number): void {
        this._index = index;
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

    public applyPrimarySurfaceInterval(): void {
        this.surfaceInterval = Number.POSITIVE_INFINITY;
    }

    public applyOneHourSurfaceInterval(): void {
        this.surfaceInterval = Time.oneHour;
    }

    public apply30MinutesSurfaceInterval(): void {
        this.surfaceInterval = Time.oneMinute * 30;
    }

    public apply2HourSurfaceInterval(): void {
        this.surfaceInterval = Time.oneHour * 2;
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

    public get hasMany(): boolean {
        return this._dives.length > 1;
    }

    public get empty(): boolean {
        return this.length <= 1;
    }

    public get selectedTanks(): TanksService {
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
            this.dispatcher.sendSelectedChanged(newValue.id);
        }
    }

    // consider unify usage by id or by diveId
    public setSelectedIndex(newIndex: number): void {
        if(newIndex >= 0 && newIndex < this._dives.length) {
            this.selected = this._dives[newIndex];
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
            this.selectPreviousDive(dive);
            this.dispatcher.sendDepthChanged();
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

        this.dispatcher.sendSetSimple();
    }

    public validId(diveId: number): boolean {
        // the dives are always ordered by Id
        const maxDiveId = this._dives[this._dives.length - 1].id;
        return maxDiveId >= diveId && diveId > 0;
    }

    public byId(diveId: number): DiveSchedule | undefined {
        return _(this.dives)
            .filter(d => d.id === diveId)
            .first();
    }

    private createDiveSchedule(): DiveSchedule {
        return new DiveSchedule(this.length, this.units, this.dispatcher);
    }

    private renumber(): void {
        this._dives.forEach((dive, index) => {
            dive.assignIndex(index);
        });
    }

    private selectPreviousDive(dive: DiveSchedule): void {
        // to be independent on the collection, dive already removed
        const currentIndex = dive.id - 1;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        this._selected = this._dives[newIndex];
    }
}
