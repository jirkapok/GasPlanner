import { BreathingModelFactory } from './BreathingModelFactory';
import { OpenCircuitBreathing } from './BreathingModel';
import { PscrBreathing } from './PscrBreathing';
import { CircuitType } from './RebreatherOptions';
import { Options } from '../algorithm/Options';
import { DepthConverter } from '../physics/depth-converter';

describe('Breathing model factory', () => {
    const depthConverter = DepthConverter.simple();

    it('creates open circuit by default', () => {
        const model = BreathingModelFactory.create(new Options(), 20, depthConverter);
        expect(model).toBeInstanceOf(OpenCircuitBreathing);
    });

    it('creates pSCR', () => {
        const options = new Options();
        options.rebreather.circuit = CircuitType.pscr;
        const model = BreathingModelFactory.create(options, 20, depthConverter);
        expect(model).toBeInstanceOf(PscrBreathing);
    });
});
