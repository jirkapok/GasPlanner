import { PlanFactory } from './PlanFactory';
import { Segment, Segments } from './Segments';
import { Tank } from '../consumption/Tanks';
import { OptionExtensions } from '../algorithm/Options.spec';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { PscrBreathing } from '../ccr/PscrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';

describe('Plan factory - Bailout emergency ascent', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const depthConverter = new DepthConverterFactory(options).create();
    const tank = new Tank(15, 200, 32);
    const plan = PlanFactory.createPlan(30, 40, tank, options).items;
    const openCircuit = new OpenCircuitBreathing(depthConverter);

    const emergencyAscent = (breathing: BreathingModel): Segment[] =>
        PlanFactory.emergencyAscent(plan, options, [tank], breathing);

    it('pSCR bottom loaded from the leaner loop gas needs longer ascent than open circuit', () => {
        const pscr = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, depthConverter);
        expect(Segments.duration(emergencyAscent(pscr))).toBeGreaterThan(Segments.duration(emergencyAscent(openCircuit)));
    });

    it('generated ascent is breathed from the tank gas', () => {
        const pscr = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, depthConverter);
        const ascent = emergencyAscent(pscr);
        const last = ascent[ascent.length - 1];
        expect(last.gas.compositionEquals(tank.gas)).toBeTrue();
        expect(last.endDepth).toBe(0);
    });
});
