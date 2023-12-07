import { Injectable } from '@angular/core';
import { AlgorithmParams, BuhlmannAlgorithm, DepthConverter, Gas, Options } from 'scuba-physics';

export class NdlLimit {
    public depth = 0;
    public limit = 3600;
}

@Injectable()
export class NdlService {
    public calculate(gas: Gas, options: Options): NdlLimit[] {
        const results = [];
        const depthConverter = DepthConverter.simple();
        const maxDepthBars = gas.mod(options.maxPpO2);
        let mod = depthConverter.fromBar(maxDepthBars);
        if(mod > 42) {
            mod = 42;
        }

        const algorithm = new BuhlmannAlgorithm();

        for(let depth = 12; depth <= mod; depth += options.decoStopDistance) {
            const parameters = AlgorithmParams.forSimpleDive(depth, gas, options);
            const duration = algorithm.noDecoLimit(parameters);
            const found = {
                depth: depth,
                limit: duration
            };
            results.push(found);
        }

        return results;
    }
}
