import _ from 'lodash';
import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Tissues } from './Tissues';
import { Precision } from './common/precision';
import { Gases } from './gases/Gases';
import { Segments } from './Segments';
import { Options } from './Options';
import { StandardGases } from './gases/StandardGases';
import { FeatureFlags } from "./common/featureFlags";
import { LoadedTissues } from "./Tissues.api";
import {
    AlgorithmParams, RestingParameters, SurfaceIntervalParameters
} from './BuhlmannAlgorithmParameters';
import { AltitudePressure } from "./pressure-converter";

describe('Buhlmann Algorithm - Repetitive dives', () => {
    const sut = new BuhlmannAlgorithm();
    const options = new Options(1, 1, 1.6, 1.6);

    const createDiveParameters = (depth: number, rest?: RestingParameters) => {
        const gases = new Gases();
        gases.add(StandardGases.trimix1845);
        const segments = new Segments();
        segments.add(depth, StandardGases.trimix1845, Time.oneMinute * 2);
        segments.addFlat(StandardGases.trimix1845, Time.oneMinute * 60);
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

    const toTissueResult = (loaded: LoadedTissues, precision = 8) => _(loaded)
        .map(t => ({
            pN2: Precision.round(t.pN2, precision),
            pHe: Precision.round(t.pHe, precision)
        }))
        .value();

    const applySurfaceInterval = (loaded: LoadedTissues, altitude: number, duration: number): LoadedTissues => {
        const parameters = new SurfaceIntervalParameters(loaded, altitude, duration);
        return sut.applySurfaceInterval(parameters).finalTissues;
    };

    const stableTissues = Tissues.createLoadedAt(0);

    it('Algorithm params set default tissues for incorrect loaded tissues', () => {
        const emptyTissues = new Array(16).fill({ pN2: 0, pHe: 0 }) as LoadedTissues;
        const surfaceParams = new RestingParameters(emptyTissues, Time.oneMinute * 10);
        const params = AlgorithmParams.forSimpleDive(10, StandardGases.air, options, surfaceParams);
        const resolvedTissues = params.surfaceInterval.previousTissues;
        const surfaceDefaultTissues = Tissues.create(AltitudePressure.standard).finalState();
        expect(resolvedTissues).toEqual(surfaceDefaultTissues);
    });

    describe('Surface interval', () => {
        it('Isn\'t applied for 0 seconds surface interval duration', () => {
            const diveResult = diveOnTrimix();
            const restedTissues = applySurfaceInterval(diveResult.finalTissues, 0, 0);
            const r1 = toTissueResult(diveResult.finalTissues);
            const r2 = toTissueResult(restedTissues);
            expect(r1).toEqual(r2);
        });

        it('Reset tissues to stable for infinite surface interval', () => {
            const diveResult = diveOnTrimix();
            const restedTissues = applySurfaceInterval(diveResult.finalTissues, 0, Number.POSITIVE_INFINITY);
            const r1 = toTissueResult(restedTissues);
            const r2 = toTissueResult(stableTissues);
            expect(r1).toEqual(r2);
        });

        it('Doesn\'t change not loaded tissues', () => {
            const r1 = toTissueResult(stableTissues);
            const restedTissues = applySurfaceInterval(stableTissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(restedTissues);
            expect(r1).toEqual(r2);
        });

        it('Adapts to higher altitude', () => {
            const r1 = toTissueResult(stableTissues);
            const restedTissues = applySurfaceInterval(stableTissues, 1000, Time.oneMinute * 10);
            const r2 = toTissueResult(restedTissues);
            expect(_(r1).every((item, index) =>
                item.pN2 > r2[index].pN2 && r2[index].pN2 !== 0 && r2[index].pHe === 0
            )).toBeTruthy();
        });

        it('Adapts to lower altitude', () => {
            const source = applySurfaceInterval(stableTissues, 1000, Time.oneMinute * 120);
            const r1 = toTissueResult(source);
            const result2 = applySurfaceInterval(stableTissues, 500, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pN2 < r2[index].pN2 && r2[index].pN2 !== 0 && r2[index].pHe === 0
            )).toBeTruthy();
        });

        it('Adapts helium loading', () => {
            const diveResult = diveOnTrimix();
            const r1 = toTissueResult(diveResult.finalTissues);
            const result2 = applySurfaceInterval(diveResult.finalTissues, 0, Time.oneMinute * 10);
            const r2 = toTissueResult(result2);
            expect(_(r1).every((item, index) =>
                item.pHe > r2[index].pHe && item.pHe !== 0 && r2[index].pHe !== 0
            )).toBeTruthy();
        });

        it('Tissue come back to original state after 1.5 days surface interval', () => {
            const diveResult = diveOnTrimix();
            const restedTissues = applySurfaceInterval(diveResult.finalTissues, 0, Time.oneHour * 36);
            const roundto = 2; // rounding to less than 1 % of error
            const r1 = toTissueResult(restedTissues, roundto);
            const r2 = toTissueResult(stableTissues, roundto);
            expect(r1).toEqual(r2);
        });

        it('Fills the over pressures', () => {
            const original = FeatureFlags.Instance.collectSaturation;
            FeatureFlags.Instance.collectSaturation = true;
            const duration = Time.oneMinute * 10;
            const parameters = new SurfaceIntervalParameters(stableTissues, 0, duration);
            const result = sut.applySurfaceIntervalStatistics(parameters);
            expect(result.tissueOverPressures.length).toEqual(duration);
            FeatureFlags.Instance.collectSaturation = original;
        });
    });

    describe('Following dive', () => {
        it('Deco calculation ends with different tissues loading', () => {
            const firstDive = diveOnTrimix();
            const restingParameters = new RestingParameters(firstDive.finalTissues, Time.oneMinute * 5);
            const secondDive = diveOnTrimix(restingParameters);

            const firstTissues = toTissueResult(firstDive.finalTissues);
            const secondTissues = toTissueResult(secondDive.finalTissues);

            // there is difference in both he and N2, some tissues have higher loading, some lower.
            expect(firstTissues).not.toEqual(secondTissues);
        });

        it('Deco calculation generates reproducible results', () => {
            const firstDive = diveOnTrimix();
            const secondDive = diveOnTrimix();
            const firstTissues = toTissueResult(firstDive.finalTissues);
            const secondTissues = toTissueResult(secondDive.finalTissues);
            expect(firstTissues).toEqual(secondTissues);
        });

        it('Nodeco limit are lower', () => {
            const firstDive = diveOnTrimix();
            const firstDiveNdl = noDecoLimits();
            const restingParameters = new RestingParameters(firstDive.finalTissues, Time.oneMinute * 10);
            const secondDiveNdl = noDecoLimits(restingParameters);
            expect(_(firstDiveNdl).every((item, index) => item > secondDiveNdl[index] ))
                .toBeTruthy();
        });
    });
});
