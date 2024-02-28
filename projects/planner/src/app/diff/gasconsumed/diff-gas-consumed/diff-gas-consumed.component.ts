import {Component} from '@angular/core';
import {GasToxicity, Tank} from 'scuba-physics';
import {faSlidersH} from '@fortawesome/free-solid-svg-icons';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';

@Component({
    selector: 'app-diff-gas-consumed',
    templateUrl: './diff-gas-consumed.component.html',
    styleUrls: ['./diff-gas-consumed.component.scss', '../../diff.component.scss']
})
export class GasConsumedDifferenceComponent {
    public icon = faSlidersH;

    constructor(public profileComparatorService: ProfileComparatorService) {
    }

    public get tanks(): Tank[] {
        return this.profileComparatorService.profileA.tanksService.tankData;
    }

    public get toxicity(): GasToxicity {
        return this.profileComparatorService.profileA.optionsService.toxicity;
    }
}
