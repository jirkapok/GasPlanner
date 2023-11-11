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

    // TODO Implement UI with all controls bound to the schedules (complex depths, complex tanks, complex settings,
    //  profile chart, profile table, dive results)
    // TODO SettingsNormalizationService - needs to normalize all schedules
    // TODO Implement line of calculations in PlannerService.calculate(diveId)
    // TODO Replace obsolete methods in PreferencesStorage and Preferences
    // TODO implement restore if last selected dive

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
        const current = this.schedules.selected;
        this.preferences.saveDefaultFrom(current);
    }

    public loadAll(){
        this.preferences.loadAll(this.schedules);
    }

    private loadDefaultTo(dive: DiveSchedule) {
        this.preferences.loadDefaultTo(dive);
        this.preferences.save();
        this.schedule.schedule();
    }
}