import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { Diver } from 'scuba-physics';

@Component({
    selector: 'app-diver',
    templateUrl: './diver.component.html',
    styleUrls: ['./diver.component.css']
})
export class DiverComponent{
    public diver: Diver;
    public icon = faUserCog;

    constructor(private planer: PlannerService, private router: Router) {
        this.diver = this.planer.diver;
    }

    public goBack(): void {
        this.router.navigateByUrl('/');
    }
}
