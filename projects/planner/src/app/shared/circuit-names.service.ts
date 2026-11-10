import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CircuitType } from 'scuba-physics';

/**
 * Localized short names of the breathing circuits (e.g. "mCCR") used in dive titles.
 * Exception to keeping texts in templates: dive titles are built in TypeScript and shown on many pages.
 */
@Injectable({
    providedIn: 'root'
})
export class CircuitNames {
    private static readonly keys: Record<CircuitType, string> = {
        [CircuitType.oc]: 'circuit.oc',
        [CircuitType.pscr]: 'circuit.pscr',
        [CircuitType.mccr]: 'circuit.mccr',
        [CircuitType.eccr]: 'circuit.eccr'
    };

    constructor(private translate: TranslateService) {
    }

    /** Translated on every call, so the name follows the current language */
    public name(circuit: CircuitType): string {
        return this.translate.instant(CircuitNames.keys[circuit]) as string;
    }
}
