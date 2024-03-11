import { Gas } from './Gases';
import { StandardGases } from './StandardGases';


describe('Standard gases', () => {
    describe('Find name by fractions', () => {
        it('Air', () => {
            const found = StandardGases.nameFor(.21);
            expect(found).toBe('Air');
        });

        it('EAN32', () => {
            const found = StandardGases.nameFor(.32);
            expect(found).toBe('EAN32');
        });

        it('Name Oxygen', () => {
            const found = StandardGases.nameFor(1);
            expect(found).toBe('Oxygen');
        });

        it('Trimix 10/70', () => {
            const found = StandardGases.nameFor(0.1, 0.7);
            expect(found).toBe('Trimix 10/70');
        });

        it('Helitrox 21/35', () => {
            const found = StandardGases.nameFor(0.21, 0.35);
            expect(found).toBe('Helitrox 21/35');
        });

        it('0% oxygen = empty name', () => {
            const found = StandardGases.nameFor(0);
            expect(found).toBe('');
        });

        it('Trimix 0% oxygen = empty name', () => {
            const found = StandardGases.nameFor(0, 70);
            expect(found).toBe('');
        });
    });

    describe('By name', () => {
        it('IS NOT case sensitive', () => {
            const found = StandardGases.byName('OXYGEN');
            expect(found).not.toBeNull();
        });

        it('Oxygen', () => {
            const found = StandardGases.byName('Oxygen');
            expect(found).toEqual(StandardGases.oxygen);
        });

        it('Ean32', () => {
            const found = StandardGases.byName('EAN32');
            expect(found).toEqual(StandardGases.ean32);
        });

        it('Non standard Ean28', () => {
            const control = new Gas(.28, 0);
            const found = StandardGases.byName('EAN28');
            expect(found).toEqual(control);
        });

        it('Name Air', () => {
            const found = StandardGases.byName('Air');
            expect(found).toEqual(StandardGases.air);
        });

        it('Name Trimix 10/70', () => {
            const found = StandardGases.byName('10/70');
            expect(found).toEqual(StandardGases.trimix1070);
        });

        it('Name 10/70', () => {
            const found = StandardGases.byName('10/70');
            expect(found).toEqual(StandardGases.trimix1070);
        });

        it('Ean00', () => {
            const found = StandardGases.byName('Ean00');
            expect(found).toBeNull();
        });

        it('00/00', () => {
            const found = StandardGases.byName('00/00');
            expect(found).toBeNull();
        });

        it('Empty name = no gas', () => {
            const found = StandardGases.byName('');
            expect(found).toBeNull();
        });

        it('Unknown name = no gas', () => {
            const found = StandardGases.byName('unknonwname');
            expect(found).toBeNull();
        });
    });
});
