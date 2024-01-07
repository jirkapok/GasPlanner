import {Injectable} from '@angular/core';
import {DiveSchedules} from './dive.schedules';
import {DiveResults} from './diveresults';

@Injectable()
export class ProfileComparatorService {

    private _profileAIndex = 0;
    private _profileBIndex = 1;

    constructor(private schedules: DiveSchedules) {
    }

    set profileAIndex(value: number) {
        this._profileAIndex = value;
    }

    set profileBIndex(value: number) {
        this._profileBIndex = value;
    }

    public profileAResults(): DiveResults {
        return this.schedules.dives[this._profileAIndex].diveResult;
    }

    public profileBResults(): DiveResults {
        return this.schedules.dives[this._profileBIndex].diveResult;
    }

    public hasTwoProfiles(): boolean {
        return this.schedules.length > 1;
    }
}
