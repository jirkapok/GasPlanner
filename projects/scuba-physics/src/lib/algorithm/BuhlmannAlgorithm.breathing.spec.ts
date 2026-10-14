import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';

describe('Buhlmann Algorithm - Breathing model', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const openCircuit = new OpenCircuitBreathing(new DepthConverterFactory(options).create());

    it('multilevel dive parameters keep the provided model', () => {
        const parameters = AlgorithmParams.forMultilevelDive(new Segments(), new Gases(), options, openCircuit);
        expect(parameters.breathing).toBe(openCircuit);
    });

    it('simple dive parameters keep the provided model', () => {
        const parameters = AlgorithmParams.forSimpleDive(30, StandardGases.air, options, openCircuit);
        expect(parameters.breathing).toBe(openCircuit);
    });
});
