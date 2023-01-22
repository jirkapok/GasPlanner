import { TestBed } from '@angular/core/testing';
import { Diver } from 'scuba-physics';

import { OptionsDispatcherService } from './options-dispatcher.service';

describe('OptionsDispatcherService', () => {
    let service: OptionsDispatcherService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ OptionsDispatcherService ]
        });
        service = TestBed.inject(OptionsDispatcherService);
    });

    it('Use recommended applies default values', () => {
        service.ascentSpeed6m = 1;
        service.useRecommended();
        expect(service.ascentSpeed6m).toBe(3);
    });

    it('Apply diver updates ppO2 limits', () => {
        const diver = new Diver();
        diver.maxPpO2 = 1.22;
        diver.maxDecoPpO2 = 1.45;
        service.applyDiver(diver);
        expect(service.maxPpO2).toBe(1.22);
        expect(service.maxDecoPpO2).toBe(1.45);
    });
});
