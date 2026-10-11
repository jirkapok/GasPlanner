import { EventEmitter, Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class DiffOptions {
    private _alignChartByEnd = false;
    private optionsChanged = new EventEmitter<void>();

    public readonly optionsChanged$ = this.optionsChanged.asObservable();

    public get alignChartByEnd(): boolean {
        return this._alignChartByEnd;
    }

    public set alignChartByEnd(value: boolean) {
        this._alignChartByEnd = value;
        this.optionsChanged.next();
    }
}
