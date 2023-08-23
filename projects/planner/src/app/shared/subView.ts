import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { ViewStates } from './viewStates';
import { ViewState } from './serialization.model';
import { PreferencesService } from './preferences.service';

@Injectable()
export abstract class SubViewComponent {
    constructor(private location: Location) { }

    public goBack(): void {
        this.location.back();
    }
}


@Injectable()
export abstract class PersistedSubViewComponent<TView extends ViewState> extends SubViewComponent {
    constructor(public viewState: TView,
        private viewId: string,
        private views: ViewStates,
        private preferences: PreferencesService,
        location: Location) {
        super(location);
    }

    public saveView(): void {
        this.views.set(this.viewId, this.viewState);
        this.preferences.saveDefaults();
    }

    public loadView(): void {
        const loaded = this.views.get<TView>(this.viewId);
        if (loaded) {
            this.viewState = loaded;
        }
    }
}
