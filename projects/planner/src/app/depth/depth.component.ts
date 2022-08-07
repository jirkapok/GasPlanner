import { Component, Input } from '@angular/core';
import { StandardGases } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.css']
})
export class DepthComponent{
    @Input() // TODO fix depth binding
    public depth = 30;

    constructor(public units: UnitConversion){
    }

    public get bestMix(): string {
        // TODO const o2 = this.planner.bestNitroxMix() / 100;
        const o2 = 0.32;
        return StandardGases.nameFor(o2);
    }

    public applyMaxDepth(): void {
        // TODO applyMaxDepth
    }
}
