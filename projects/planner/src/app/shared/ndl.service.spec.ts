import { TestBed } from '@angular/core/testing';
import { Options, StandardGases } from 'scuba-physics';

import { NdlService } from './ndl.service';

describe('NdlServiceService', () => {
    let service: NdlService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NdlService);
    });

    it('Calculates NDL table', () => {
        const options = new Options();
        const gas = StandardGases.air.copy();
        const results = service.calculate(gas, options);
        expect(results.length).toBe(11);
    });
});
