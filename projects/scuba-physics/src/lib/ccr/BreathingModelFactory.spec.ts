import { BreathingModelFactory } from './BreathingModelFactory';
import { OpenCircuitBreathing } from './BreathingModel';
import { PscrBreathing } from './PscrBreathing';
import { MccrBreathing } from './MccrBreathing';
import { EccrBreathing } from './EccrBreathing';
import { CircuitType } from './RebreatherOptions';
import { Options } from '../algorithm/Options';
import { DepthConverter } from '../physics/depth-converter';
import { Tank } from '../consumption/Tanks';

describe('Breathing model factory', () => {
    const depthConverter = DepthConverter.simple();
    const tanks = [new Tank(12, 200, 21), new Tank(3, 200, 100)];

    it('creates open circuit by default', () => {
        const model = BreathingModelFactory.create(new Options(), 20, tanks, depthConverter);
        expect(model).toBeInstanceOf(OpenCircuitBreathing);
    });

    it('creates pSCR', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.pscr;
        const model = BreathingModelFactory.create(options, 20, tanks, depthConverter);
        expect(model).toBeInstanceOf(PscrBreathing);
    });

    it('creates mCCR with oxygen from the dive tanks', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.mccr;
        const model = BreathingModelFactory.create(options, 20, tanks, depthConverter);
        expect(model).toBeInstanceOf(MccrBreathing);
        expect(model.oxygenTank).toBe(tanks[1]);
    });

    it('creates eCCR with oxygen from the dive tanks', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.eccr;
        const model = BreathingModelFactory.create(options, 20, tanks, depthConverter);
        expect(model).toBeInstanceOf(EccrBreathing);
        expect(model.oxygenTank).toBe(tanks[1]);
    });
});
