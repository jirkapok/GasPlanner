import {Component} from '@angular/core';
import {TestDataInjector} from '../testDataInjector';
import {DiveSchedules} from '../../../shared/dive.schedules';

@Component({
    selector: 'app-loadtestdata',
    templateUrl: './loadtestdata.component.html',
    styleUrls: ['./loadtestdata.component.scss']
})
export class LoadTestDataComponent {

    constructor(public testDataInjector: TestDataInjector, private schedules: DiveSchedules) {
    }

    public loadData(){
        this.testDataInjector.injectAllProfiles();
    }

    public isLoaded() {
        return this.schedules.length === this.testDataInjector.testProfilesCount;
    }
}
