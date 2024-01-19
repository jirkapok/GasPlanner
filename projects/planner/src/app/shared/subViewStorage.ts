import { KnownViews, ViewStates } from './viewStates';
import { DashBoardViewState, ViewState } from './views.model';
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
    // no need to restore at startup, it is immediately overriden
    private _mainViewState: DashBoardViewState = {
        id: KnownViews.dashboard,
        selectedDiveIndex: 0
    };

    constructor(
        private views: ViewStates,
        private preferences: PreferencesStore) {
    }

    public saveMainView() {
        this.saveView(this._mainViewState);
    }

    public saveView<TView extends ViewState>(viewState: TView): void {
        this.views.set(viewState);
        this.preferences.save();
    }

    public loadView<TView extends ViewState>(viewId: string): TView {
        const loaded = this.views.get<TView>(viewId);
        return loaded as TView;
    }

    public setSelectedDive(newIndex: number) {
        this._mainViewState.selectedDiveIndex = newIndex;
    }
}
