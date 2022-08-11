import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-pp-o2',
    templateUrl: './pp-o2.component.html',
    styleUrls: ['./pp-o2.component.css']
})
export class PpO2Component {
    @Input()
    public label = '';
    @Output()
    public maxPpO2Change = new EventEmitter<number>();
    @Output()
    public inputChange = new EventEmitter();

    private _maxPpO2 = 1.4;

    constructor(public units: UnitConversion) { }

    @Input()
    public get maxPpO2(): number {
        return this._maxPpO2;
    }

    public set maxPpO2(newValue: number) {
        this._maxPpO2 = newValue;
        this.maxPpO2Change.emit(newValue);
    }
}
