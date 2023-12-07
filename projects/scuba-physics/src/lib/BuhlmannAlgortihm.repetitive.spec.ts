import _ from 'lodash';
import { Time } from './Time';
import { AlgorithmParams, BuhlmannAlgorithm, SurfaceIntervalParameters } from './BuhlmannAlgorithm';
import { LoadedTissue, Tissues } from './Tissues';
import { Precision } from './precision';
import { Gases, StandardGases } from './Gases';
import { Segments } from './Segments';
import { Options } from './Options';

describe('Buhlmann Algorithm - Repetitive dives', () => {
    const sut = new BuhlmannAlgorithm();

    const firstDiveOnTrimix = () => {
        const gases = new Gases();
        gases.add(StandardGases.trimix1845);
        const segments = new Segments();
        segments.add(0, 20, StandardGases.trimix1845, Time.oneMinute * 2);
        segments.addFlat(40, StandardGases.trimix1845, Time.oneMinute * 60);
        const options = new Options(1, 1, 1.6, 1.6);
        const parameters = AlgorithmParams.forMultilevelDive(segments, gases, options);
        const diveResult = sut.decompression(parameters);
        return diveResult;
    };

    const toTissueResult = (loaded: LoadedTissue[]) => _(loaded)
        .map(t => ({
            pN2: Precision.round(t.pN2, 8),
            pHe: Precision.round(t.pHe, 8)
        }))
        .value();

    const applySurfaceInterval = (loaded: LoadedTissue[], altitude: number, duration: number): LoadedTissue[] => {
        const parameters = new SurfaceIntervalParameters(loaded, altitude, duration);
        return sut.applySurfaceInterval(parameters);
    };

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
            const diveResult = firstDiveOnTrimix();
            const r1 = toTissueResult(diveResult.tissues);
            const result2 = applySurfaceInterval(diveResult.tissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pHe > r2[index].pHe && item.pHe !== 0 && r2[index].pHe !== 0
            )).toBeTruthy();
        });
    });

    // TODO Buhlmann repetitive dive test cases:
    // * Tissues are loaded after dive (all values higher then at beginning)
    // * no deco is lower, if there is residual nitrogen from previous dive

    xdescribe('Following dive', () => {
        it('Has higher tissues loading', () => {
            const firstDive = firstDiveOnTrimix();
            const secondDive = firstDiveOnTrimix();
            expect(firstDive).toEqual(secondDive);
        });
    });
});
