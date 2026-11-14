import { TranslateService } from '@ngx-translate/core';
import { CircuitNames } from './circuit-names.service';

const englishNames: Record<string, string> = {
    'circuit.oc': 'OC',
    'circuit.pscr': 'pSCR',
    'circuit.mccr': 'mCCR',
    'circuit.eccr': 'eCCR'
};

/** Loads the English circuit short names, so dive titles in specs read as in the application */
export const useEnglishCircuitNames = (translate: TranslateService): void => {
    translate.setTranslation('en', {
        circuit: { oc: 'OC', pscr: 'pSCR', mccr: 'mCCR', eccr: 'eCCR' }
    }, true);
    translate.use('en');
};

/** English circuit names for specs creating dive schedules without the Angular injector */
export const englishCircuitNames = (): CircuitNames => {
    const translate = { instant: (key: string) => englishNames[key] ?? key } as unknown as TranslateService;
    return new CircuitNames(translate);
};
