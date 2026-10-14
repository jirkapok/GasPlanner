import { Injectable } from '@angular/core';
import {
    AlgorithmParams, BuhlmannAlgorithm, DepthConverter, DepthConverterFactory, Gas, OpenCircuitBreathing, Options, Time
} from 'scuba-physics';

export class NdlLimit {
    public depth = 0;
    public limit = Time.oneHour;
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
        const breathing = new OpenCircuitBreathing(new DepthConverterFactory(options).create());

        for(let depth = 12; depth <= mod; depth += options.decoStopDistance) {
            const parameters = AlgorithmParams.forSimpleDive(depth, gas, options, breathing);
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
