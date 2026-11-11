import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { DiveResults } from './diveresults';
import { DepthsService } from './depths.service';
import { ReloadDispatcher } from './reloadDispatcher';
import {
    CircuitType, GasToxicity, LoadedTissues, Precision, ProfileTissues, RebreatherTanks, Time
} from 'scuba-physics';
import { TankBound } from './models';
import { CircuitNames } from './circuit-names.service';
import _ from 'lodash';
import { DateFormats } from './formaters';

export class DiveSchedule {
    // changes without selecting other dive, when a previous dive is removed
    private readonly _id = signal(0);
    private _surfaceInterval = Number.POSITIVE_INFINITY;
    private readonly _diveResult = new DiveResults();
    private readonly _optionsService: OptionsService;
    private readonly _tanks: TanksService;
    private readonly _depths: DepthsService;

    constructor(private _index: number, private units: UnitConversion, private dispatcher: ReloadDispatcher,
        private circuitNames: CircuitNames) {
        this.assignIndex(_index);
        this._tanks = new TanksService(units, dispatcher);
        this._optionsService = new OptionsService(this.units, this.dispatcher);
        this._depths = new DepthsService(this.units, this.tanksService, this._diveResult, this._optionsService, this.dispatcher);
    }

    public get index(): number {
        return this._index;
    }

    public get id(): number {
        return this._id();
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
        if(!this.isRepetitive) {
            return null;
        }

        return DateFormats.formatShortTime(this.surfaceInterval);
    }

    /**
     * It is not the first dive of the day, e.g. it is repetitive dive.
     * Distinguish from isFirst property.
     */
    public get isRepetitive(): boolean {
        return this.surfaceInterval !== Number.POSITIVE_INFINITY;
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

    /** Templates reading it (e.g. title) are refreshed, when options are changed or reloaded */
    public get circuit(): CircuitType {
        this.dispatcher.trackOptions();
        return this.optionsService.circuit;
    }

    /** Localized short name of the breathing circuit, e.g. "mCCR" */
    public get circuitName(): string {
        return this.circuitNames.name(this.circuit);
    }

    /**
     * Tanks breathed from the rebreather loop: diluent and oxygen for closed circuit,
     * supply tanks assigned to depth levels for pSCR. Empty for open circuit.
     */
    public get rebreatherTanks(): TankBound[] {
        const tanks = this.tanksService.tanks;

        switch (this.circuit) {
            case CircuitType.mccr:
            case CircuitType.eccr:
                return tanks.slice(0, RebreatherTanks.oxygenIndex + 1);
            case CircuitType.pscr: {
                const supply = this.depths.levels.map(l => l.tank.tank);
                return tanks.filter(t => supply.includes(t.tank));
            }
            default:
                return [];
        }
    }

    /** Rebreather tanks not used by the loop, used only during the bailout ascent. Empty for open circuit. */
    public get bailoutTanks(): TankBound[] {
        if (this.circuit === CircuitType.oc) {
            return [];
        }

        const loop = this.rebreatherTanks;
        return this.tanksService.tanks.filter(t => !loop.includes(t));
    }

    /** Translated on every read, so it follows the language and circuit switch */
    public get title(): string {
        const depth = Precision.round(this.depths.plannedDepth, 1);
        const depthUnits = this.units.length;
        const duration = Precision.round(this.depths.planDuration, 1);
        return `${this.id}. ${this.circuitName} ${depth} ${depthUnits}, ${duration} min`;
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
        this._id.set(index + 1);
    }

    public applyNitrox(fO2: number, pO2: number): void {
        this.tanksService.firstTank.o2 = fO2;
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
    // dives are added, removed and selected by other components than the ones showing them
    private readonly _dives: WritableSignal<DiveSchedule[]>;
    private readonly _selected: WritableSignal<DiveSchedule>;

    constructor(private units: UnitConversion, private dispatcher: ReloadDispatcher, private circuitNames: CircuitNames) {
        const first = new DiveSchedule(0, this.units, this.dispatcher, this.circuitNames);
        this._dives = signal([first]);
        this._selected = signal(first);
    }

    public get dives(): DiveSchedule[] {
        return this._dives().slice();
    }

    public get selected(): DiveSchedule {
        return this._selected();
    }

    public get length(): number {
        return this._dives().length;
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
        if (this._dives().includes(newValue)) {
            this._selected.set(newValue);
            this.dispatcher.sendSelectedChanged(newValue.id);
        }
    }

    // consider unify usage by id or by diveId
    public setSelectedIndex(newIndex: number): void {
        if(newIndex >= 0 && newIndex < this.length) {
            this.selected = this._dives()[newIndex];
        }
    }

    public add(): DiveSchedule {
        const newDive = this.createDiveSchedule();
        this._dives.set([...this._dives(), newDive]);
        this._selected.set(newDive);
        return newDive;
    }

    public remove(dive: DiveSchedule): void {
        if (!this.empty) {
            this._dives.set(this._dives().filter(g => g !== dive));
            this.renumber();
            this.selectPreviousDive(dive);
            this.dispatcher.sendDepthChanged();
        }
    }

    public clear(): void {
        // there should always be at least one dive
        this._dives.set(this._dives().slice(0, 1));
    }

    /**
     * Since the View switch is global, we need to switch all dives.
     */
    public setSimple(): void {
        this._dives().forEach((dive) => {
            dive.setSimple();
        });

        this.dispatcher.sendSetSimple();
    }

    public validId(diveId: number): boolean {
        // the dives are always ordered by Id
        const maxDiveId = this._dives()[this.length - 1].id;
        return maxDiveId >= diveId && diveId > 0;
    }

    public byId(diveId: number): DiveSchedule | undefined {
        return _(this.dives)
            .filter(d => d.id === diveId)
            .first();
    }

    /** Results of the previous dive, only if the dive is repetitive, otherwise undefined. */
    public previousDiveResult(diveId: number): DiveResults | undefined {
        const previousDive = this.byId(diveId - 1);
        const dive = this.byId(diveId);

        if(previousDive && dive && dive.isRepetitive) {
            return previousDive.diveResult;
        }

        return undefined;
    }

    public previousDiveTissues(diveId: number): LoadedTissues {
        const previousResult = this.previousDiveResult(diveId);

        if(previousResult) {
            return previousResult.finalTissues;
        }

        const dive = this.byId(diveId);

        if(dive) {
            const currentDiveAltitude = dive.optionsService.altitude || 0;
            ProfileTissues.createAtSurface(currentDiveAltitude);
        }

        // Should never happen, but let us recover at sea level.
        return ProfileTissues.createAtSurface(0);
    }

    /** Marks all following repetitive dives as started */
    public markStart(diveId: number): void {
        this.processOnFollowingRepetitiveDives(diveId, (dive) => dive.diveResult.start());
    }

    private processOnFollowingRepetitiveDives(diveId: number, action: (dive: DiveSchedule) => void): void {
        const dive = this.byId(diveId);

        if(!dive) {
            return;
        }

        action(dive);

        for (let index = dive.index + 1; index < this.length; index++) {
            const currentDive = this._dives()[index];
            if(!currentDive.isRepetitive) {
                return;
            }

            action(currentDive);
        }
    }

    private createDiveSchedule(): DiveSchedule {
        return new DiveSchedule(this.length, this.units, this.dispatcher, this.circuitNames);
    }

    private renumber(): void {
        this._dives().forEach((dive, index) => {
            dive.assignIndex(index);
        });
    }

    private selectPreviousDive(dive: DiveSchedule): void {
        // to be independent on the collection, dive already removed
        const currentIndex = dive.id - 1;
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        this._selected.set(this._dives()[newIndex]);
    }
}
