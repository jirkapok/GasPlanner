import {Injectable} from '@angular/core';
import {PreferencesStore} from '../../shared/preferencesStore';
import {PlannerService} from '../../shared/planner.service';
import {TestDataJsonProvider} from './TestDataJsonProvider';

@Injectable()
export class TestDataInjector {

    private testDataProvider = new TestDataJsonProvider();
    private _testProfilesCount = this.testDataProvider.numberOfProfiles();
    constructor(private preferencesStore: PreferencesStore, private plannerService: PlannerService) {
    }

    get testProfilesCount(): number {
        return this._testProfilesCount;
    }

    // !! ONLY FOR TESTING PURPOSES !!
    // Rewrites user defined dive profiles and replaces with 2 pre-defined testing profiles
    public injectProfiles(profileAIndex: number, profileBIndex: number){
        const preferencesJson: string = this.testDataProvider.get(profileAIndex, profileBIndex);
        localStorage.setItem('preferences', preferencesJson);
        this.preferencesStore.load();
        this.plannerService.calculate(1);
        this.plannerService.calculate(2);
    }

    public injectAllProfiles() {
        const preferencesJson: string = this.testDataProvider.getAll();
        localStorage.setItem('preferences', preferencesJson);
        this.preferencesStore.load();
        for (let i = 1; i <= this.testDataProvider.numberOfProfiles(); i++){
            this.plannerService.calculate(i);
        }
    }
}
