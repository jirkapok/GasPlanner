import { TestBed } from '@angular/core/testing';

import { Gradients, StandardGradientsService } from './standard-gradients.service';

describe('StandardGradientsService', () => {
    let service: StandardGradientsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(StandardGradientsService);
    });

    it('Unknown name returns 100% gf', () => {
        const found = service.get('unknown');
        expect(found).toEqual(new Gradients(1, 1));
    });

    it('Known label return expected gf', () => {
        const found = service.get(service.highName);
        expect(found).toEqual(new Gradients(0.3, 0.75));
    });

    it('Known Gf return expected label', () => {
        const found = service.labelFor(0.3, 0.75);
        expect(found).toEqual('High (30/75)');
    });

    it('Custom Gf return empty label', () => {
        const found = service.labelFor(0.5, 0.5);
        expect(found).toEqual('');
    });
});
