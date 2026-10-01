import {Injectable} from '@angular/core';
import {PreferencesStore} from './preferencesStore';
import {DiveSchedule, DiveSchedules} from './dive.schedules';
import {DelayedScheduleService} from './delayedSchedule.service';
import { SubViewStorage } from './subViewStorage';

@Injectable()
export class ManagedDiveSchedules {
    constructor(
        private schedules: DiveSchedules,
        private preferences: PreferencesStore,
        private schedule: DelayedScheduleService,
        private viewStore: SubViewStorage
    ) {
        this.preferences.ensureDefault();
        // consider speedup start by storing calculated final tissues to prevent calculation of all dives
        this.loadAll();
    }

    public get length(): number {
        return this.schedules.length;
    }

    public get empty(): boolean {
        return this.schedules.empty;
    }

    public get dives(): DiveSchedule[] {
        return this.schedules.dives;
    }

    public get selectedIndex(): number {
        return this.schedules.selected.index;
    }

    public get selected(): DiveSchedule {
        return this.schedules.selected;
    }

    public cloneSelected(): void {
        this.cloneSelectedAndModify(() => {});
    }

    public cloneSelectedDeeper(): void {
        this.cloneSelectedAndModify(added => added.depths.extendDeepestDepth());
    }

    public cloneSelectedLonger(): void {
        this.cloneSelectedAndModify(added => added.depths.extendDeepestDuration());
    }

    public cloneSelectedDeeperAndLonger(): void {
        this.cloneSelectedAndModify(added => added.depths.extendDeepestDepthAndDuration());
    }

    public add(): void {
        const added = this.schedules.add();
        this.loadDefaultTo(added);
    }

    public remove(dive: DiveSchedule): void {
        this.schedules.remove(dive);
        this.preferences.save();
    }

    public loadDefaults(): void {
        const current = this.schedules.selected;
        this.loadDefaultTo(current);
    }

    public saveDefaults(): void {
        this.preferences.saveDefault();
    }

    public loadAll(){
        this.preferences.load();
        // we dont need to load the selected dive, since it is loaded by preferences
        this.schedule.startScheduling();
    }

    public select(newIndex: number): void {
        // order matters, since first update main view and second enforces save preferences
        this.viewStore.setSelectedDive(newIndex);
        this.schedules.setSelectedIndex(newIndex);
    }

    /** Creates new dive as copy of the selected one and applies the modification only to the new dive. */
    private cloneSelectedAndModify(modify: (added: DiveSchedule) => void): void {
        const toLoadFrom = this.schedules.selected;
        const added = this.schedules.add();
        this.preferences.loadFrom(toLoadFrom, added);
        modify(added);
        this.preferences.save();
    }

    private loadDefaultTo(dive: DiveSchedule) {
        this.preferences.loadDefault(dive);
        this.preferences.save();
    }
}
