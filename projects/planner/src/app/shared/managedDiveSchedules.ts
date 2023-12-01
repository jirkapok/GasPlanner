import {Injectable} from '@angular/core';
import {PreferencesStore} from './preferencesStore';
import {DiveSchedule, DiveSchedules} from './dive.schedules';
import {DelayedScheduleService} from './delayedSchedule.service';

@Injectable()
export class ManagedDiveSchedules {
    constructor(
        private schedules: DiveSchedules,
        private preferences: PreferencesStore,
        private schedule: DelayedScheduleService
    ) { }

    // TODO Implement line of calculations in PlannerService.calculate(diveId)
    // TODO implement restore of last selected dive on page reload
    // TODO consider speedup start by storing calculated final tissues to prevent calculation of all dives
    // TODO what happens if we switch to siple view?
    // Do we need to recalculate all dives? Or switch only current?

    public add(): void {
        const added = this.schedules.add();
        this.loadDefaultTo(added);
    }

    public remove(dive: DiveSchedule): void {
        this.schedules.remove(dive);
        this.preferences.save();
        this.schedule.schedule();
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
    }

    private loadDefaultTo(dive: DiveSchedule) {
        this.preferences.loadDefault(dive);
        this.preferences.save();
        this.schedule.schedule();
    }
}
