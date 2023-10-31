import {Injectable} from '@angular/core';
import {PreferencesStore} from './preferencesStore';
import {DivesSchedule} from './dives.schedule';

@Injectable()
export class ManagedDiveSchedules {
    constructor(private schedules: DivesSchedule, private preferences: PreferencesStore) {
    }

    public add(): void {
        const added = this.schedules.add();
        const setup = this.preferences.loadDefaultTo();
        if(setup) {
            added.loadFrom(setup);
        }
    }
}
