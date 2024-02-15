import {Injectable} from '@angular/core';
import {DiveSchedule, DiveSchedules} from './dive.schedules';
import {DiveResults} from './diveresults';

@Injectable()
export class ProfileComparatorService {

    private _profileAIndex = 0;
    private _profileBIndex = 0;

    constructor(private schedules: DiveSchedules) {
    }

    get totalDuration(): number {
        if(this.profileAResults.totalDuration > this.profileBResults.totalDuration){
            return this.profileAResults.totalDuration;
        }
        return this.profileBResults.totalDuration;
    }

    public get profileA(): DiveSchedule {
        return this.schedules.dives[this._profileAIndex];
    }

    public get profileB(): DiveSchedule {
        return this.schedules.dives[this._profileBIndex];
    }

    public get profileAResults(): DiveResults {
        return this.profileA.diveResult;
    }

    public get profileBResults(): DiveResults {
        return this.profileB.diveResult;
    }

    set profileAIndex(value: number) {
        this._profileAIndex = value;
    }

    set profileBIndex(value: number) {
        this._profileBIndex = value;
    }

    public hasTwoProfiles(): boolean {
        return this.schedules.length > 1;
    }

    public areResultsCalculated(): boolean {
        return this.profileAResults.calculated && this.profileBResults.calculated;
    }

    public areDiveInfosCalculated(): boolean {
        return this.profileAResults.diveInfoCalculated && this.profileBResults.diveInfoCalculated;
    }

    public areProfilesCalculated(): boolean {
        return this.profileAResults.profileCalculated && this.profileBResults.profileCalculated;
    }
}
