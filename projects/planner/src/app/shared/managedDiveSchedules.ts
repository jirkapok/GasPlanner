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
    ) {
        // TODO consider speedup start by storing calculated final tissues to prevent calculation of all dives
        this.loadAll();
    }

    // TODO Implement line of calculations in PlannerService.calculate(diveId)

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
        // TODO implement restore of last selected dive on page reload
        // there is always at least one.
        this.schedules.selected = this.schedules.dives[0];
    }

    private loadDefaultTo(dive: DiveSchedule) {
        this.preferences.loadDefault(dive);
        this.preferences.save();
    }
}
