import { Injectable } from '@angular/core';
import { BuhlmannAlgorithm, Gas, Options } from 'scuba-physics';

export class NdlLimit {
    public depth = 0;
    public limit = 3600;
}

@Injectable({
    providedIn: 'root'
})
export class NdlService {
    public calculate(gas: Gas, options: Options): NdlLimit[] {
        const results = [];
        const algorithm = new BuhlmannAlgorithm();

        for(let depth = 12; depth <= 42; depth += options.decoStopDistance) {
            const duration = algorithm.noDecoLimit(depth, gas, options);
            const found = {
                depth: depth,
                limit: duration
            };
            results.push(found);
        }

        return results;
    }
}
