import { GasNames } from 'scuba-physics';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { UnitConversion } from '../shared/UnitConversion';
import { PlanRequestFactory } from '../shared/planRequestFactory';
import { TanksService } from '../shared/tanks.service';
import { ComputerRequestDto, ComputerResultDto, ComputerStartedDto } from '../shared/serialization.model';
import { ComputerTasks } from './computer.tasks';

/** Chrome only, precise values require --enable-precise-memory-info, see karma.performance.conf.js */
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

/** Requires --js-flags=--expose-gc, see karma.performance.conf.js */
const garbageCollector = (): (() => void) | undefined => (globalThis as unknown as { gc?: () => void }).gc;

const collectGarbage = (): void => {
    garbageCollector()?.();
};

const toMegaBytes = (bytes: number): number => Math.round(bytes / 1024 / 1024 * 100) / 100;

describe('Computer data performance', () => {
    const createRequest = (depth: number, duration: number, configureTanks?: (tanks: TanksService) => void): ComputerRequestDto => {
        const schedules = new DiveSchedules(new UnitConversion(), new ReloadDispatcher());
        const dive = schedules.selected;
        configureTanks?.(dive.tanksService);
        dive.depths.plannedDepth = depth;
        dive.depths.planDuration = duration;
        const request = PlanRequestFactory.create(dive, schedules.previousDiveTissues(dive.id));
        return { ...request, calculationId: 1 };
    };

    /** Bottom gas trimix 12/65, deco gases EAN50, oxygen, trimix 21/35 and trimix 35/25 */
    const trimixTanks = (tanks: TanksService): void => {
        // helium first, so the oxygen isn't limited by the previous helium content
        tanks.firstTank.he = 65;
        tanks.firstTank.o2 = 12;

        ['EAN50', GasNames.oxygenName, 'Helitrox 21/35', 'Helitrox 35/25'].forEach((gasName) => {
            tanks.addTank();
            const added = tanks.tanks[tanks.tanks.length - 1];
            added.assignStandardGas(gasName);
        });
    };

    /** Calculates complete computer data the same way as the worker and measures it */
    const measure = (name: string, request: ComputerRequestDto): Measurement => {
        const messages: ComputerResultDto[] = [];
        collectGarbage();
        const heapBefore = usedHeap();
        let peakHeap = heapBefore;
        const start = performance.now();

        ComputerTasks.calculate(request, (message) => {
            messages.push(message);
            peakHeap = Math.max(peakHeap, usedHeap());
        });

        const durationMs = performance.now() - start;
        collectGarbage();
        // messages are still referenced, so the retained heap contains the complete computer data
        const retainedHeap = usedHeap();
        const started = messages[0] as ComputerStartedDto;
        const result: Measurement = {
            durationMs: Math.round(durationMs),
            points: messages.filter(m => m.type === 'point').length,
            peakHeapMb: toMegaBytes(peakHeap - heapBefore),
            retainedHeapMb: toMegaBytes(retainedHeap - heapBefore)
        };

        console.log(`${name}: ${result.durationMs} ms, ${result.points} points, ` +
            `peak heap +${result.peakHeapMb} MB, retained heap +${result.retainedHeapMb} MB`);

        expect(messages[messages.length - 1].type).toEqual('finished');
        expect(result.points).toEqual(started.total);
        expect(result.points).toBeGreaterThan(0);
        return result;
    };

    it('Memory measurement is available', () => {
        expect(usedHeap()).not.toBeNaN();
        expect(garbageCollector()).toBeDefined();
    });

    it('30 m for 30 min on air', () => {
        measure('30 m / 30 min, air', createRequest(30, 30));
    });

    it('60 m for 200 min on air', () => {
        measure('60 m / 200 min, air', createRequest(60, 200));
    });

    it('80 m for 30 min on trimix 12/65 with EAN50, oxygen, trimix 21/35 and trimix 35/25', () => {
        measure('80 m / 30 min, trimix 12/65 + EAN50, O2, 21/35, 35/25', createRequest(80, 30, trimixTanks));
    });
});
