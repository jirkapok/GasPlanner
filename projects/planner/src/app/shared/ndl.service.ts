import { Injectable } from '@angular/core';
import { BuhlmannAlgorithm, DepthConverter, Gas, Options } from 'scuba-physics';

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
        const depthConverter = DepthConverter.simple();
        const maxDepthBars = gas.mod(options.maxPpO2);
        let mod = depthConverter.fromBar(maxDepthBars);
        if(mod > 42) {
            mod = 42;
        }

        for(let depth = 12; depth <= mod; depth += options.decoStopDistance) {
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
