import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { CircuitType } from 'scuba-physics';
import { CircuitNames } from './circuit-names.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { useEnglishCircuitNames } from './circuit-names.testing';

describe('Circuit names', () => {
    let sut: CircuitNames;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideTestTranslate()]
        });
        useEnglishCircuitNames(TestBed.inject(TranslateService));
        sut = TestBed.inject(CircuitNames);
    });

    it('translates every circuit type to its short name', () => {
        expect(sut.name(CircuitType.oc)).toBe('OC');
        expect(sut.name(CircuitType.pscr)).toBe('pSCR');
        expect(sut.name(CircuitType.mccr)).toBe('mCCR');
        expect(sut.name(CircuitType.eccr)).toBe('eCCR');
    });

    it('follows the current language', () => {
        const translate = TestBed.inject(TranslateService);
        translate.setTranslation('cs', { circuit: { oc: 'OK' } });
        translate.use('cs');
        expect(sut.name(CircuitType.oc)).toBe('OK');
    });
});
