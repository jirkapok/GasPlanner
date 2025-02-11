import _ from 'lodash';
import { ProfileTissues } from "./ProfileTissues";
import { LoadSegment, Tissues } from "./Tissues";
import { StandardGases } from "../gases/StandardGases";
import { Time } from "../physics/Time";
import { LoadedTissues } from "./Tissues.api";

describe('Profile tissues', () => {
    const sut = new ProfileTissues();

    describe('Surface gradient', () => {
        const surfacePressure = 1;

        it('Not loaded at surface Is 0 %', () => {
            const loadedTissues = Tissues.create(surfacePressure).finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBe(0);
        });

        it('Is 25.6 % when loaded 20 min. at 20 m', () => {
            const loadSegment = new LoadSegment(2, Time.oneMinute * 20, 0);
            const tissues = Tissues.create(surfacePressure);
            tissues.load(loadSegment, StandardGases.air);
            const loadedTissues = tissues.finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBeCloseTo(0.255723, 6);
        });

        it('Loaded at altitude is still 0 %', () => {
            const altitudePressure = 0.8;
            const loadedTissues = Tissues.create(altitudePressure).finalState();
            const result = sut.surfaceGradient(loadedTissues, surfacePressure);
            expect(result).toBe(0);
        });
    });

    const createTissuesState = (tissue5pN2: number): LoadedTissues => {
        const sample= Tissues.create(1).finalState();
        sample[4].pN2 = tissue5pN2;
        return sample;
    };

    const createLoadedTissues = (nitrogenHistory: number[]): LoadedTissues[] => {
        const created = _(nitrogenHistory).map((s) => createTissuesState(s))
            .value();
        return created;
    };

    describe('Off gasing Start', () => {
        it('Empty tissues returns negative index', () => {
            const loadedTissues: LoadedTissues[] = [];
            const result = sut.offgasingStart(loadedTissues);
            expect(result).toEqual(-1);
        });

        it('Wrong number of tissues in any sample throws Error', () => {
            const wrongSample = new Array(15).fill({ pHe: 0, pN2: 0 }) as LoadedTissues;
            expect(() => sut.offgasingStart([wrongSample])).toThrow();
        });

        it('No submerging saturation returns dive start', () => {
           const loadedTissues = createLoadedTissues([1, 1, 1, 1, 1]);
           const result = sut.offgasingStart(loadedTissues);
           expect(result).toEqual(4);
        });

        it('Simple profile saturation returns 5th sample index', () => {
            const loadedTissues = createLoadedTissues([1, 2, 3, 4, 4, 3, 2]);
            const result = sut.offgasingStart(loadedTissues);
            expect(result).toEqual(5);
        });

        it('Multi-level profile saturation returns 5th sample index', () => {
            const loadedTissues = createLoadedTissues([1, 2, 3, 2, 3, 4, 3, 2]);
            const result = sut.offgasingStart(loadedTissues);
            expect(result).toEqual(6);
        });

        it('5th tissues stops offgasing on long deco stop', () => {
            const loadedTissues = createLoadedTissues([1, 2, 3, 4, 3, 3, 3]);
            const result = sut.offgasingStart(loadedTissues);
            expect(result).toEqual(4);
        });

        it('5th tissues is not the leading tissue', () => {
            const loadedTissues = createLoadedTissues([1, 2, 3, 2, 3, 2, 1]);
            // shift the leading tissue, all other tissues offgas at 4th sample
            loadedTissues[3] = createTissuesState(3);
            loadedTissues[3][4].pN2 = 4;

            const result = sut.offgasingStart(loadedTissues);
            expect(result).toEqual(4);
        });
    });
});
