import _ from 'lodash';
import { Time } from './Time';
import {
    AlgorithmParams, BuhlmannAlgorithm, RestingParameters, SurfaceIntervalParameters
} from './BuhlmannAlgorithm';
import { LoadedTissue, Tissues } from './Tissues';
import { Precision } from './precision';
import { Gases, StandardGases } from './Gases';
import { Segments } from './Segments';
import { Options } from './Options';
import { AltitudePressure } from './pressure-converter';

describe('Buhlmann Algorithm - Repetitive dives', () => {
    const sut = new BuhlmannAlgorithm();

    const createDiveParameters = (depth: number, rest?: RestingParameters) => {
        const gases = new Gases();
        gases.add(StandardGases.trimix1845);
        const segments = new Segments();
        segments.add(0, depth, StandardGases.trimix1845, Time.oneMinute * 2);
        segments.addFlat(depth, StandardGases.trimix1845, Time.oneMinute * 60);
        const options = new Options(1, 1, 1.6, 1.6);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, rest);
    };

    const diveOnTrimix = (rest?: RestingParameters) => {
        const parameters = createDiveParameters(40, rest);
        return sut.decompression(parameters);
    };

    const depths: number[] =  Array.from(
        { length: 11 },
        (v, index) => 12 + index * 3
    );

    const noDecoLimits = (rest?: RestingParameters): number[] => _(depths).map(depth => {
        const parameters = createDiveParameters(depth, rest);
        return sut.noDecoLimit(parameters);
    }).value();

    const toTissueResult = (loaded: LoadedTissue[], precision = 8) => _(loaded)
        .map(t => ({
            pN2: Precision.round(t.pN2, precision),
            pHe: Precision.round(t.pHe, precision)
        }))
        .value();

    const applySurfaceInterval = (loaded: LoadedTissue[], altitude: number, duration: number): LoadedTissue[] => {
        const parameters = new SurfaceIntervalParameters(loaded, altitude, duration);
        return sut.applySurfaceInterval(parameters);
    };

    // We need to use real pressure at 0 m.a.s.l
    const stableTissues = Tissues.create(AltitudePressure.standard).finalState();

    describe('Surface interval', () => {
        it('Isn\'t applied for 0 seconds surface interval duration.', () => {
            const r1 = toTissueResult(stableTissues);
            const result = applySurfaceInterval(stableTissues, 0, 0);
            const r2 = toTissueResult(result);
            expect(r1).toEqual(r2);
        });

        it('Isn\'t applied for Infinite surface interval duration.', () => {
            const r1 = toTissueResult(stableTissues);
            const result = applySurfaceInterval(stableTissues, 0, Number.POSITIVE_INFINITY);
            const r2 = toTissueResult(result);
            expect(r1).toEqual(r2);
        });

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
            const diveResult = diveOnTrimix();
            const r1 = toTissueResult(diveResult.tissues);
            const result2 = applySurfaceInterval(diveResult.tissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pHe > r2[index].pHe && item.pHe !== 0 && r2[index].pHe !== 0
            )).toBeTruthy();
        });

        it('Tissue come back to original state after 1.5 days surface interval', () => {
            const diveResult = diveOnTrimix();
            const surfaceIntervalResult = applySurfaceInterval(diveResult.tissues, 0, Time.oneHour * 36);
            const roundto = 2; // rounding to less than 1 % of error
            const r1 = toTissueResult(surfaceIntervalResult, roundto);
            const r2 = toTissueResult(stableTissues, roundto);
            expect(r1).toEqual(r2);
        });
    });

    xdescribe('Following dive', () => {
        it('Has higher tissues loading', () => {
            const firstDive = diveOnTrimix();
            const restingParameters = new RestingParameters(firstDive.tissues, Time.oneMinute * 5);
            const secondDive = diveOnTrimix(restingParameters);

            const firstTissues = toTissueResult(firstDive.tissues);
            const secondTissues = toTissueResult(secondDive.tissues);

            expect(_(firstTissues).every((item, index) =>
                item.pHe < secondTissues[index].pHe && item.pN2 < secondTissues[index].pN2 &&
                item.pHe !== 0 && secondTissues[index].pHe !== 0
            )).toBeTruthy();
        });

        it('Nodeco limit are lower', () => {
            const firstDive = diveOnTrimix();
            const firstDiveNdl = noDecoLimits();
            const restingParameters = new RestingParameters(firstDive.tissues, Time.oneMinute * 5);
            const secondDiveNdl = noDecoLimits(restingParameters);
            expect(_(firstDiveNdl).every((item, index) => item < secondDiveNdl[index] ))
                .toBeTruthy();
        });
    });
});
