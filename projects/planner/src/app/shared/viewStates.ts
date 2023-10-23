import { Injectable } from '@angular/core';
import { AppStates } from './serialization.model';
import { ViewState } from '../shared/views.model';

export class KnownViews {
    public static readonly dashboard = 'dashboard';
    public static readonly nitrox = 'nitrox';
    public static readonly sac = 'sac';
    public static readonly ndl = 'ndl';
    public static readonly settings = 'settings';
    public static readonly about = 'about';
    public static readonly altitude = 'altitude';
    public static readonly weight = 'weight';
    public static readonly gas = 'gas';
    public static readonly diff = 'diff';
    public static readonly redundancies = 'redundancies';
}

@Injectable()
export class ViewStates {
    private states = new Map<string, ViewState>();
    private _lastView = KnownViews.dashboard;
    private _started = false;

    public get lastView(): string {
        return this._lastView;
    }

    public get started(): boolean {
        return this._started;
    }

    /** Redirect to sub view only during application start.
     * After that (Any view already saved state) don\'t redirect. */
    public get redirectToView(): boolean {
        return !this._started && this._lastView !== KnownViews.dashboard &&
            this._lastView !== '/'; // upgrade scenario from v0.1.20
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
        this._started = true;
        this.states.set(view.id, view);
        this._lastView = view.id;
    }

    public reset(): void {
        this.loadFrom({
            lastScreen: KnownViews.dashboard,
            states: []
        });
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
