import _ from 'lodash';
import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { LoadedTissues, Tissues } from './Tissues';
import { Precision } from './precision';
import { Gases, StandardGases } from './Gases';
import { Segments } from './Segments';
import { Options } from './Options';


// TODO Buhlmann repetitive dive test cases:
// * Tissues parameters have meaningful values at beginning of the dive
//   * All 16 tissues with positive non zero partial pressure of nitrogen and positive or zero helium
// * Tissues are loaded after dive (all values higher then at beginning)
// * no deco is lower, if there is residual nitrogen from previous dive

// TODO Bulhmann create parameters crate

describe('Buhlmann Algorithm - Repetitive dives', () => {
    const sut = new BuhlmannAlgorithm();
    const toTissueResult = (loaded: LoadedTissues) => _(loaded.tissues)
        .map(t => ({
            pN2: Precision.round(t.pN2, 8),
            pHe: Precision.round(t.pHe, 8)
        }))
        .value();

    const applySurfaceInterval = (loaded: LoadedTissues, altitude: number, duration: number): LoadedTissues =>
        sut.applySurfaceInterval(loaded, altitude, duration);

    // used enough long interval, so the tissues are stable on 8 dicimal places
    const stableTissues = applySurfaceInterval(Tissues.create(1).finalState(), 0, Time.oneDay * 9);

    describe('Surface interval', () => {
        it('Doesn\'t change not loaded tissues.', () => {
            const r1 = toTissueResult(stableTissues);
            const result = applySurfaceInterval(stableTissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(result);
            expect(r1).toEqual(r2);
        });

        it('Adapts to higher altitude.', () => {
            const r1 = toTissueResult(stableTissues);
            const result = applySurfaceInterval(stableTissues, 1000, Time.oneMinute * 10);
            const r2 = toTissueResult(result);
            expect(_(r1).every((item, index) =>
                item.pN2 > r2[index].pN2 && r2[index].pN2 !== 0 && r2[index].pHe === 0
            )).toBeTruthy();
        });

        it('Adapts to lower altitude.', () => {
            const source = applySurfaceInterval(stableTissues, 1000, Time.oneMinute * 120);
            const r1 = toTissueResult(source);
            const result2 = applySurfaceInterval(stableTissues, 500, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pN2 < r2[index].pN2 && r2[index].pN2 !== 0 && r2[index].pHe === 0
            )).toBeTruthy();
        });

        it('Adapts helium loading.', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1845);
            const segments = new Segments();
            segments.add(0, 20, StandardGases.trimix1845, Time.oneMinute * 2);
            segments.addFlat(40, StandardGases.trimix1845, Time.oneMinute * 60);
            const options = new Options(1, 1, 1.6, 1.6);
            const diveResult = sut.calculateDecompression(options, gases, segments);

            const r1 = toTissueResult(diveResult.tissues);
            const result2 = applySurfaceInterval(diveResult.tissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pHe > r2[index].pHe && item.pHe !== 0 && r2[index].pHe !== 0
            )).toBeTruthy();
        });
    });
});
