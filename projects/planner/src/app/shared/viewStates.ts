import { Injectable } from '@angular/core';
import { AppStates, ViewState } from './serialization.model';

// TODO create list of known viewIds

@Injectable()
export class ViewStates {
    private states = new Map<string, ViewState>();
    private _lastView = '';

    public get lastView(): string {
        return this._lastView;
    }

    public get redirectToView(): boolean {
        return this._lastView !== '/';
    }

    public get all(): ViewState[] {
        return [...this.states.values()];
    }

    /**
     * Returns view state only once, after first usage it returns null
     * @param id case sensitive id as view key
     */
    public get<TView extends ViewState>(id: string): TView | null {
        const current = this.states.get(id);
        return current as TView;
    }

    public set<TView extends ViewState>(view: TView): void {
        this.states.set(view.id, view);
        this._lastView = view.id;
    }

    public loadFrom(source: AppStates): void {
        if (!source || !source.states) {
            return;
        }

        this._lastView = source.lastScreen;
        this.states.clear();
        source.states.forEach(v => {
            this.states.set(v.id, v);
        });
    }
}
