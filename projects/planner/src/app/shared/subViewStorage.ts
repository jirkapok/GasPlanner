import { ViewStates } from './viewStates';
import { ViewState } from './serialization.model';
import { PreferencesStore } from './preferencesStore';
import { Injectable } from '@angular/core';

@Injectable()
export class SubViewStorage<TView extends ViewState> {
    constructor(
        private views: ViewStates,
        private preferences: PreferencesStore) {
    }

    public saveView(viewState: TView): void {
        this.views.set(viewState);
        this.preferences.save();
    }

    public loadView(viewId: string): TView {
        const loaded = this.views.get<TView>(viewId);
        return loaded as TView;
    }

    // workflow:
    // App start: user enters any url angular router redirects to correct component:
    // - loads preferences - DONE
    // A dashboard:
    //   A with url arguments: loads state - DONE
    //   B no url arguments (loaded as default route or started as mobile app):
    //     - checks for saved lastView:
    //        A redirects to subview
    //        B loads default state - DONE
    // B subview: load state - DONE

    // navigation (or redirect from dashboard)
    // - On change save state
}
