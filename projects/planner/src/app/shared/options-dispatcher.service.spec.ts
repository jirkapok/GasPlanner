import { TestBed } from '@angular/core/testing';
import { Options } from 'scuba-physics';

import { OptionsDispatcherService } from './options-dispatcher.service';

describe('OptionsDispatcherService', () => {
    let service: OptionsDispatcherService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(OptionsDispatcherService);
    });

    it('Change property fires change event', () => {
        let eventArgs: Options | null = null;
        service.change.subscribe((o) => eventArgs = o);
        service.altitude = 1000;
        expect(eventArgs).not.toBeNull();
    });
});
