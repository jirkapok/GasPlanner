import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.css']
})
export class DepthComponent{
    @Input()
    public bestMix = '';

    @Output()
    public applyMaxDepth = new EventEmitter();

    @Output()
    public inputChange = new EventEmitter();

    @Output()
    public depthChange = new EventEmitter<number>();

    private _depth = 30;

    constructor(public units: UnitConversion){}

    @Input()
    public get depth(): number {
        return this._depth;
    }

    public set depth(newValue: number) {
        this._depth = newValue;
        this.depthChange.emit(this._depth);
    }

    public fireApplyMaxDepth(): void {
        this.applyMaxDepth.emit();
    }
}
