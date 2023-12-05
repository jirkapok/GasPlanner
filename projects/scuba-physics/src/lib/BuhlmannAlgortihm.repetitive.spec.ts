import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Tissues } from './Tissues';


// TODO Buhlmann repetitive dive test cases:
// * Tissues parameters have meaningful values at beginning of the dive
//   * All 16 tissues with positive non zero partial pressure of nitrogen and positive or zero helium
// * Tissues are loaded after dive (all values higher then at beginning)
// * Surface interval:
//   * no adaptation needed at the same elevation first dive
//   * Adaptation to higher altitude
//   * Adaptation to lower altitude
//   * tissues load is reduced after some time at surface
// * no deco is lower, if there is residual nitrogen from previous dive

// TODO Bulhmann create parameters crate

describe('Buhlmann Algorithm - Repetitive dives', () => {
    describe('Surface interval', () => {
        it('Does`nt change not loaded tissues.', () => {
            const tissues = Tissues.create(1);
            const sut = new BuhlmannAlgorithm();
            const result = sut.applySurfaceInterval(tissues.finalState(), Time.oneMinute * 60);

            expect(result).toEqual(tissues.finalState());
        });
    });
});
