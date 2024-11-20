import { LoadedTissue, LoadSegment, Tissue, Tissues, TissuesValidator } from './Tissues';
import { Compartments } from './Compartments';
import { Time } from './Time';
import { StandardGases } from './StandardGases';

describe('Tissues', () => {
    const createTissue = () => new Tissue(Compartments.buhlmannZHL16C[0], 1);

    describe('Creation', () => {
        it('Tissues Create generates valid tissues', () => {
            const wrongCount: LoadedTissue[] = Tissues.create(1).finalState();
            const valid = TissuesValidator.valid(wrongCount);
            expect(valid).toBeTruthy();
        });

        it('Copy creates new valid deep copy', () => {
            const source = createTissue();
            const copy = source.copy();
            expect(copy).toEqual(source);
        });
    });

    describe('Validation', () => {
        it('Empty is invalid', () => {
            const valid = TissuesValidator.valid([]);
            expect(valid).toBeFalsy();
        });

        it('Non 16 compartments is invalid', () => {
            const wrongCount: LoadedTissue[] = Tissues.create(1).finalState().slice(14);
            const valid = TissuesValidator.valid(wrongCount);
            expect(valid).toBeFalsy();
        });

        it('One invalid item', () => {
            const tissues: LoadedTissue[] = Tissues.create(1).finalState();
            tissues[0] = { a: 0, b: 0, pHe: 0, pN2: -1 };
            const valid = TissuesValidator.valid(tissues);
            expect(valid).toBeFalsy();
        });
    });


    describe('Tissue', () => {
        it('Not loaded tissue ceiling is 0 m', () => {
            const tissue = createTissue();
            const ceiling = tissue.ceiling(1);
            expect(ceiling).toBe(0);
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
            // simple depth conversion at surface
            const tissues = Tissues.create(1);
            tissues.load(segment, StandardGases.air);
            const saturationRatios = tissues.saturationRatio(2, 1, 1);
            expect(saturationRatios[0]).toBeCloseTo(1, 8);
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
