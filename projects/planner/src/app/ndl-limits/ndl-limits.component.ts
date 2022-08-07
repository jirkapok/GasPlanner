import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faTable, faCog } from '@fortawesome/free-solid-svg-icons';
import { Time } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';


export class NdlLimit {
    public depth = 0;
    public limit = 3600;
}

@Component({
    selector: 'app-ndl-limits',
    templateUrl: './ndl-limits.component.html',
    styleUrls: ['./ndl-limits.component.css']
})
export class NdlLimitsComponent {
    public icon = faTable;
    public iconConfig = faCog;
    public totalDuration = Time.oneDay;
    public isComplex = false;
    public calculating = false;

    public limits: NdlLimit[] = [
        {
            depth: 12,
            limit: 200
        },
        {
            depth: 12,
            limit: 360
        }
    ];

    constructor(private router: Router, public units: UnitConversion) { }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }
}
