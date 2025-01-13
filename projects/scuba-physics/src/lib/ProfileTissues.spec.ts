import _ from 'lodash';
import { ProfileTissues } from "./ProfileTissues";
import { LoadSegment, Tissues } from "./Tissues";
import { StandardGases } from "./StandardGases";
import { Time } from "./Time";
import { TissueOverPressures } from "./Tissues.api";

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

    const createTissuesState = (overPressure: number)=> new Array(16).fill(overPressure);

    const createFilledOverPressures = (saturations: number[]): TissueOverPressures => {

        const created = _(saturations).map((s) => createTissuesState(s)).value();
        return created;
    };

    describe('Off gasing Start', () => {
        it('Empty saturation returns dive start', () => {
            const overPressures: TissueOverPressures = [];
            const result = sut.offgasingStart(overPressures);
            expect(result).toEqual({ runtime: 0, depth: 0 });
        });

        it('Wrong number of tissues in any sample throws Error', () => {
            const wrongSample = new Array(15).fill(0);
            expect(() => sut.offgasingStart([wrongSample])).toThrow();
        });

        it('No submerging saturation returns dive start', () => {
           const overPressures: TissueOverPressures = createFilledOverPressures([0, 0, 0, 0, 0]);
           const result = sut.offgasingStart(overPressures);
           expect(result).toEqual({ runtime: 0, depth: 0 });
        });

        it('Simple profile saturation returns 5th sample index', () => {
            const overPressures: TissueOverPressures = createFilledOverPressures([0, -0.1, -0.2, -0.1, 0, 0.1, 0.1]);
            const result = sut.offgasingStart(overPressures);
            expect(result).toEqual({ runtime: 5, depth: 0 });
        });

        it('Multi-level profile saturation returns 5th sample index', () => {
            const overPressures: TissueOverPressures = createFilledOverPressures([0, -0.1, 0, 0.1, -0.1, 0, 0.1, 0.1]);
            const result = sut.offgasingStart(overPressures);
            expect(result).toEqual({ runtime: 6, depth: 0 });
        });

        it('5th tissues stops offgasing on long deco stop', () => {
            const overPressures: TissueOverPressures = createFilledOverPressures([0, -0.1, 0, 0.1, 0, 0.1, 0.1]);
            const result = sut.offgasingStart(overPressures);
            expect(result).toEqual({ runtime: 3, depth: 0 });
        });

        fit('5th tissues is not the leading tissue', () => {
            const overPressures: TissueOverPressures = createFilledOverPressures([0, -0.1, 0, 0.1, 0, 0.1, 0.1]);
            // shift the leading tissue, all other tissues offgas at 5th sample
            overPressures[3] = createTissuesState(-0.1);
            overPressures[3][4] = 0.1;

            const result = sut.offgasingStart(overPressures);
            expect(result).toEqual({ runtime: 3, depth: 0 });
        });
    });
});
