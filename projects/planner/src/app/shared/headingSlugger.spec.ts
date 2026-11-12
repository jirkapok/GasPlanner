import { HeadingSlugger } from './headingSlugger';

describe('HeadingSlugger', () => {
    let sut: HeadingSlugger;

    beforeEach(() => {
        sut = new HeadingSlugger();
    });

    it('joins words by dash in lower case', () => {
        expect(sut.slug('Repetitive dives and Surface interval')).toBe('repetitive-dives-and-surface-interval');
    });

    it('creates help menu anchors', () => {
        expect(sut.slug('Tissues heat map')).toBe('tissues-heat-map');
        expect(sut.slug('mCCR')).toBe('mccr');
    });

    it('removes brackets', () => {
        expect(sut.slug('Depth(s)')).toBe('depths');
    });

    it('keeps dash and every space', () => {
        expect(sut.slug('Conservatism - Gradient Factors (Dive options)')).toBe('conservatism---gradient-factors-dive-options');
    });

    it('removes punctuation', () => {
        expect(sut.slug('RMV/SAC')).toBe('rmvsac');
        expect(sut.slug('Why Dugong planner?')).toBe('why-dugong-planner');
    });

    it('keeps emoji', () => {
        expect(sut.slug('📘 Learn Help Guide')).toBe('📘-learn-help-guide');
    });

    it('removes ampersand', () => {
        expect(sut.slug('Gases & Air')).toBe('gases--air');
    });

    it('adds counter to duplicates', () => {
        const slugs = [sut.slug('Gases'), sut.slug('Gases'), sut.slug('Gases')];
        expect(slugs).toEqual(['gases', 'gases-1', 'gases-2']);
    });

    it('reset forgets duplicates', () => {
        sut.slug('Gases');
        sut.reset();
        expect(sut.slug('Gases')).toBe('gases');
    });
});
