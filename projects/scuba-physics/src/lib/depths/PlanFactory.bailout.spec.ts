import { PlanFactory } from './PlanFactory';
import { Segment, Segments } from './Segments';
import { Tank } from '../consumption/Tanks';
import { OptionExtensions } from '../algorithm/Options.testing';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { PscrBreathing } from '../ccr/PscrBreathing';
import { MccrBreathing } from '../ccr/MccrBreathing';
import { StandardGases } from '../gases/StandardGases';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { Gas } from '../gases/Gases';
import { Time } from '../physics/Time';

/** Loop breathed as open circuit, which remembers depths of all its breaths */
class RecordingLoop extends OpenCircuitBreathing {
    public readonly depths: number[] = [];

    public override inspiredGas(sourceGas: Gas, depth = 0): Gas {
        this.depths.push(depth);
        return super.inspiredGas(sourceGas);
    }
}

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
        expect(last.gas.compositionEquals(tank.gas)).toBe(true);
        expect(last.endDepth).toBe(0);
    });

    it('mCCR bailout ascent may use the rebreather oxygen tank', () => {
        const diluent = new Tank(12, 200, 21);
        const oxygen = new Tank(3, 200, 100);
        const tanks = [diluent, oxygen];
        const mccrPlan = PlanFactory.createPlan(30, 40, diluent, options).items;
        const mccr = new MccrBreathing(new RebreatherOptions(CircuitType.mccr), tanks, depthConverter);
        const ascent = PlanFactory.emergencyAscent(mccrPlan, options, tanks, mccr);
        const breathesOxygen = ascent.some(s => s.gas.compositionEquals(StandardGases.oxygen));
        expect(breathesOxygen).toBe(true);
    });

    it('user defined ascent after the deepest point is breathed from the loop', () => {
        const recordingLoop = new RecordingLoop(depthConverter);
        const segments = PlanFactory.createPlan(30, 20, tank, options);
        segments.add(15, tank, Time.oneMinute);
        segments.addFlat(tank, Time.oneMinute * 3);

        PlanFactory.emergencyAscent(segments.items, options, [tank], recordingLoop);

        expect(recordingLoop.depths).toContain(15);
    });
});
