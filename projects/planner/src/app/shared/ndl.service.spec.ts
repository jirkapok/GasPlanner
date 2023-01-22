import { TestBed } from '@angular/core/testing';
import { Options, Salinity, StandardGases } from 'scuba-physics';

import { NdlService } from './ndl.service';

describe('NdlServiceService', () => {
    let service: NdlService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ NdlService ]
        });
        service = TestBed.inject(NdlService);
    });

    it('Calculates NDL table no deeper than 42 m', () => {
        const options = new Options();
        const gas = StandardGases.air.copy();
        const results = service.calculate(gas, options);
        expect(results.length).toBe(11);
    });

    it('Returns no rows for oxygen with MOD out of range', () => {
        const options = new Options();
        const gas = StandardGases.oxygen.copy();
        const results = service.calculate(gas, options);
        expect(results.length).toBe(0);
    });

    it('Returns rows 12-21 m for EAN50 depth range', () => {
        const options = new Options();
        options.maxPpO2 = 1.6; // because this is used to get the table not the deco poO2
        const gas = StandardGases.ean50.copy();
        const results = service.calculate(gas, options);
        expect(results[0].depth).toBe(12);
        const lastIndex = results.length - 1;
        expect(results[lastIndex].depth).toBe(21);
    });
});
