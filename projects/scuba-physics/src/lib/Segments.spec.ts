import { Segment } from "./Segments";
import { Gas } from "./Gases";

describe('Segments', () => {
    const gas = new Gas(0.21, 0);

    it('Level equals for flat segments', () => {
        const segment = new Segment(20, 20, gas, 15);
        const segment2 = new Segment(20, 20, gas, 35);
        const equals = segment.levelEquals(segment2);
        expect(equals).toBeTrue();
    });

    fdescribe('Doesn`t equal', () => {
        it('ascent segments', () => {
            const segment = new Segment(10, 20, gas, 15);
            const segment2 = new Segment(10, 20, gas, 35);
            const equals = segment.levelEquals(segment2);
            expect(equals).toBeFalse();
        });

        it('descent segments', () => {
            const segment = new Segment(20, 10, gas, 15);
            const segment2 = new Segment(20, 10, gas, 35);
            const equals = segment.levelEquals(segment2);
            expect(equals).toBeFalse();
        });

        it(' different gas', () => {
            const segment = new Segment(20, 10, gas, 15);
            const otherGas = new Gas(0.5, 0);
            const segment2 = new Segment(20, 10, otherGas, 35);
            const equals = segment.levelEquals(segment2);
            expect(equals).toBeFalse();
        });
    });
})