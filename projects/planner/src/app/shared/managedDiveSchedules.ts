import {Injectable} from '@angular/core';
import {PreferencesStore} from './preferencesStore';
import {DivesSchedule} from './dives.schedule';

@Injectable()
export class ManagedDiveSchedules {
    constructor(private schedules: DivesSchedule, private preferences: PreferencesStore) {
    }

    // TODO Implement Add, Remove
    // TODO Implement LoadDefault, SaveDefault, LoadAll
    // TODO Replace obsolete methods in PreferencesStorage and Preferences
    // TODO Implement line of calculations in PlannerService.calculate(diveId)
    // TODO Implement UI with all controls bound to the schedules

    public add(): void {
        const added = this.schedules.add();
        this.preferences.loadDefaultTo(added);
        this.preferences.save();
    }
}
