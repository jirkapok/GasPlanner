import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Segments } from '../depths/Segments';
import { Time } from '../physics/Time';

describe('Algorithm parameters', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85);
    const breathing = OptionExtensions.openCircuit(options);
    const gas = StandardGases.air;
    const gases = new Gases();
    gases.add(gas);

    const createMultilevel = (): Segments => {
        const segments = new Segments();
        segments.add(40, gas, Time.oneMinute * 2);
        segments.addFlat(gas, Time.oneMinute * 10);
        segments.add(20, gas, Time.oneMinute * 2);
        segments.addFlat(gas, Time.oneMinute * 5);
        return segments;
    };

    it('starts ascent after the deepest point by default', () => {
        const sut = AlgorithmParams.forMultilevelDive(createMultilevel(), gases, options, breathing);
        expect(sut.startAscentIndex).toBe(2);
    });

    it('keeps explicit start of ascent', () => {
        const sut = AlgorithmParams.forMultilevelDive(createMultilevel(), gases, options, breathing, undefined, 4);
        expect(sut.startAscentIndex).toBe(4);
    });

    it('starts ascent after the only segment of simple dive', () => {
        const sut = AlgorithmParams.forSimpleDive(30, gas, options, breathing);
        expect(sut.startAscentIndex).toBe(1);
    });
});
