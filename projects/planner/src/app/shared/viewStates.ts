import { Injectable } from '@angular/core';
import { ViewState } from './serialization.model';

@Injectable()
export class ViewStates {
    private states = new Map<string, ViewState>();

    public get all(): ViewState[] {
        return [...this.states.values()];
    }

    /** case sensitive id as view key */
    public get<TView extends ViewState>(id: string): TView {
        return this.states.get(id) as TView;
    }

    /** case sensitive id as view key */
    public set<TView extends ViewState>(id: string, view: TView): void {
        this.states.set(id, view);
    }

    public loadFrom(source: ViewState[]): void {
        if(!source) {
            return;
        }

        this.states.clear();
        source.forEach(v => this.states.set(v.id, v));
    }
}
