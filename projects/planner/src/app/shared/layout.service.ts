import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private _mainMenuHeight = 0;

    public get mainMenuHeight(): number {
        return this._mainMenuHeight;
    }

    public set mainMenuHeight(value: number) {
        this._mainMenuHeight = value;
    }
}
