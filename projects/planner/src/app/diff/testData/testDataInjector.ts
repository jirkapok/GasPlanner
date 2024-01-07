import {Injectable} from '@angular/core';
import {PreferencesStore} from '../../shared/preferencesStore';
import {PlannerService} from '../../shared/planner.service';
import {TestDataJsonProvider} from './TestDataJsonProvider';

@Injectable()
export class TestDataInjector {

    public testProfilesCount = TestDataJsonProvider.length;
    private testDataProvider = new TestDataJsonProvider();
    constructor(private preferencesStore: PreferencesStore, private plannerService: PlannerService) {
    }

    // !! ONLY FOR TESTING PURPOSES !!
    // Rewrites user defined dive profiles and replaces with 2 pre-defined testing profiles
    public injectProfiles(profileAIndex: number, profileBIndex: number){
        const preferencesJson: string = this.testDataProvider.get(profileAIndex, profileBIndex);
        localStorage.setItem('preferences', preferencesJson);
        this.preferencesStore.load();
        this.plannerService.calculate();
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
