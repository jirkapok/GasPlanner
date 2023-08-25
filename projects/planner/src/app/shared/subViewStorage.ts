import { KnownViews, ViewStates } from './viewStates';
import { ViewState } from './serialization.model';
import { PreferencesStore } from './preferencesStore';
import { Injectable } from '@angular/core';

/**
* workflows
* 1. Startup:
* - AppComponent: loads preferences
* - Router: user enters any url angular router redirects to correct component based on lastView
*   A dashboard (loaded as default route or started as mobile app):
*     A with url arguments: loads state
*     B no url arguments : loads default state
*   B subview: load state
*
* 2. Navigation (or redirect from Router):
* - save state directly in component constructor
 */
@Injectable()
export class SubViewStorage {
    private _mainViewState: ViewState = {
        id: KnownViews.dashboard
    };

    constructor(
        private views: ViewStates,
        private preferences: PreferencesStore) {
    }

    public saveView<TView extends ViewState>(viewState: TView): void {
        this.views.set(viewState);
        this.preferences.save();
    }

    public loadView<TView extends ViewState>(viewId: string): TView {
        const loaded = this.views.get<TView>(viewId);
        return loaded as TView;
    }

    public saveMainView() {
        this.views.set(this._mainViewState);
        this.preferences.save();
    }
}
