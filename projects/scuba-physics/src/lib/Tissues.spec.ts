import _ from 'lodash';
import { LoadSegment, Tissue, Tissues, TissuesValidator } from './Tissues';
import { Compartments } from './Compartments';
import { Time } from './Time';
import { StandardGases } from './StandardGases';
import { LoadedTissue, LoadedTissues } from "./Tissues.api";

describe('Tissues', () => {
    const createTissue = () => new Tissue(Compartments.buhlmannZHL16C[0], 1);

    describe('Creation', () => {
        it('Tissues Create generates valid tissues', () => {
            const loadedTissues: LoadedTissues = Tissues.create(1).finalState();
            const valid = TissuesValidator.valid(loadedTissues);
            expect(valid).toBeTruthy();
        });

        it('Tissues Create sets a,b coefficients', () => {
            const created: Tissues = Tissues.create(1);
            const allLoaded = _(created.compartments).every(t => t.a > 0 && t.b > 0);
            expect(allLoaded).toBeTruthy();
        });

        it('Copy creates new valid deep copy', () => {
            const source = createTissue();
            const copy = createTissue().copy();
            expect(copy).toEqual(source);
        });
    });

    describe('Create loaded', () => {
        it('Create from loaded tissues creates valid tissues', () => {
            const loaded = Tissues.create(1);
            const copy = Tissues.createLoaded(loaded.finalState());
            expect(copy).toEqual(loaded);
        });

        it('Empty loaded throws Error', () => {
            expect(() => Tissues.createLoaded(new Array(0) as LoadedTissues)).toThrow();
        });
    });

    describe('Validation', () => {
        it('Empty is invalid', () => {
            const valid = TissuesValidator.valid(new Array(0) as LoadedTissues);
            expect(valid).toBeFalsy();
        });

        it('Non 16 compartments is invalid', () => {
            const wrongCount: LoadedTissues = Tissues.create(1).finalState().slice(14) as LoadedTissues;
            const valid = TissuesValidator.valid(wrongCount);
            expect(valid).toBeFalsy();
        });

        it('One invalid item', () => {
            const tissues: LoadedTissues = Tissues.create(1).finalState();
            tissues[0] = { pHe: 0, pN2: -1 };
            const valid = TissuesValidator.valid(tissues);
            expect(valid).toBeFalsy();
        });
    });


    describe('Ceiling', () => {
        it('Not loaded tissue ceiling above surface', () => {
            const tissue = createTissue();
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(-0.23884756, 8);
        });

        it('loaded tissue have non 0 m ceiling', () => {
            const tissue = createTissue();
            const segment = new LoadSegment(2, Time.oneMinute * 30, 0);
            tissue.load(segment, StandardGases.air);
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(0.19547818, 8);
        });
    });

    xdescribe('Saturation ratio', () => {
        const segment = new LoadSegment(6, Time.oneMinute * 60, 0);

        xit('Is 0 at surface', () => {
            const tissue = createTissue();
            const saturationRatio = tissue.saturationRatio(1, 1, 1);
            expect(saturationRatio).toBeCloseTo(0, 8);
        });

        xit('Is less than 0 when descending ongassing tissues', () => {
            const tissue = createTissue();
            tissue.load(segment, StandardGases.air);
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(0.19547818, 8);
        });

        xit('Is more than +1 when exceeded M-value', () => {
            const tissue = createTissue();
            tissue.load(segment, StandardGases.air);
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(0.19547818, 8);
        });

        xit('Is more than 0 when offgasing', () => {
            const tissue = createTissue();
            tissue.load(segment, StandardGases.air);
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(0.19547818, 8);
        });

        xit('Is -1 when descending when start ongassing', () => {
            const tissue = createTissue();
            tissue.load(segment, StandardGases.air);
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBeCloseTo(0.19547818, 8);
        });
    });
});
