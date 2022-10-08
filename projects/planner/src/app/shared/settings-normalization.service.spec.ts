import { TestBed } from '@angular/core/testing';

import { SettingsNormalizationService } from './settings-normalization.service';

describe('SettingsNormalizationService', () => {
    let service: SettingsNormalizationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SettingsNormalizationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
