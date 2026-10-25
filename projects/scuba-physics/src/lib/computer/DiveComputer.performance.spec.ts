import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams, durationFor } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.testing';
import { ProfileEvents } from '../algorithm/ProfileEvents';
import { Segments } from '../depths/Segments';
import { GasDensity } from '../gases/GasDensity';
import { Gas, Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { RunTimePoint } from './ComputerData';
import { CalculatedDive, DiveComputer } from './DiveComputer';

/** Chrome only, precise values require --enable-precise-memory-info, see vitest-performance.config.mts */
interface ChromeMemory {
    usedJSHeapSize: number;
}

interface Measurement {
    durationMs: number;
    points: number;
    peakHeapMb: number;
    retainedHeapMb: number;
}

/** in bytes, NaN if not supported by the browser */
const usedHeap = (): number => {
    const memory = (performance as unknown as { memory?: ChromeMemory }).memory;
    return memory?.usedJSHeapSize ?? Number.NaN;
};

/** Requires --js-flags=--expose-gc, see vitest-performance.config.mts */
const garbageCollector = (): (() => void) | undefined => (globalThis as unknown as { gc?: () => void }).gc;

const collectGarbage = (): void => {
    garbageCollector()?.();
};

const toMegaBytes = (bytes: number): number => Math.round(bytes / 1024 / 1024 * 100) / 100;

describe('Dive computer performance', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const algorithm = new BuhlmannAlgorithm();

    /** Descent at the descent speed, then staying at the depth, so the plan takes the given minutes */
    const createDive = (depth: number, minutes: number, bottomGas: Gas, decoGases: Gas[] = []): AlgorithmParams => {
        const gases = new Gases();
        gases.add(bottomGas);
        decoGases.forEach(g => gases.add(g));
        const segments = new Segments();
        const descent = durationFor(depth, options.descentSpeed);
        segments.add(depth, bottomGas, descent);
        segments.addFlat(bottomGas, Time.oneMinute * minutes - descent);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
    };

    /** Calculates the dive the same way as the planner does: profile, ceilings, tissues history and all events */
    const calculateDive = (dive: AlgorithmParams): CalculatedDive => {
        const profile = algorithm.decompression(dive).segments;
        const calculatedSegments = Segments.fromCollection(profile);
        const calculatedDive = AlgorithmParams.forMultilevelDive(calculatedSegments, dive.gases, dive.options, dive.breathing);
        const statistics = algorithm.decompressionStatistics(calculatedDive);
        const ceilings = statistics.ceilings;
        const events = ProfileEvents.fromProfile({
            maxDensity: GasDensity.recommendedMaximum,
            startAscentIndex: calculatedSegments.startAscentIndex,
            profile: profile,
            ceilings: ceilings,
            profileOptions: dive.options,
            breathing: dive.breathing
        }).items;

        return {
            dive: dive,
            profile: profile,
            ceilings: ceilings,
            tissues: statistics.tissues,
            events: events
        };
    };

    /** Calculates complete computer data of already calculated dive and measures it */
    const measure = (name: string, dive: AlgorithmParams): Measurement => {
        const calculated = calculateDive(dive);
        const points: RunTimePoint[] = [];
        collectGarbage();
        const heapBefore = usedHeap();
        let peakHeap = heapBefore;
        const start = performance.now();

        const computer = DiveComputer.start(calculated);

        for (const point of computer.points()) {
            points.push(point);
            peakHeap = Math.max(peakHeap, usedHeap());
        }

        const durationMs = performance.now() - start;
        collectGarbage();
        // points and computer are still referenced, so the retained heap contains the complete computer data
        const retainedHeap = usedHeap();
        const result: Measurement = {
            durationMs: Math.round(durationMs),
            points: points.length,
            peakHeapMb: toMegaBytes(peakHeap - heapBefore),
            retainedHeapMb: toMegaBytes(retainedHeap - heapBefore)
        };

        console.log(`${name}: ${result.durationMs} ms, ${result.points} points, ` +
            `peak heap +${result.peakHeapMb} MB, retained heap +${result.retainedHeapMb} MB`);

        expect(result.points).toEqual(computer.total);
        expect(result.points).toBeGreaterThan(0);
        return result;
    };

    it('Memory measurement is available', () => {
        expect(usedHeap()).not.toBeNaN();
        expect(garbageCollector()).toBeDefined();
    });

    it('30 m for 30 min on air', () => {
        measure('30 m / 30 min, air', createDive(30, 30, StandardGases.air));
    });

    it('60 m for 200 min on air', () => {
        measure('60 m / 200 min, air', createDive(60, 200, StandardGases.air));
    });

    it('80 m for 30 min on trimix 12/65 with EAN50, oxygen, trimix 21/35 and trimix 35/25', () => {
        const decoGases = [StandardGases.ean50, StandardGases.oxygen, StandardGases.trimix2135, StandardGases.trimix3525];
        measure('80 m / 30 min, trimix 12/65 + EAN50, O2, 21/35, 35/25', createDive(80, 30, new Gas(0.12, 0.65), decoGases));
    });
});
