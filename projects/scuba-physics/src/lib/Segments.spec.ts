import { Segment, Segments, SegmentsValidator } from './Segments';
import { Gas } from './Gases';

describe('Segments', () => {
    const air = new Gas(0.21, 0); // 65.5m - 0m
    const trimix1070 = new Gas(0.1, 0.7);  // 148.5m - 7.9m
    const maxPpo = 1.6;

    describe('Segments validator', () => {
        it('At least one is required', () => {
            const source: Segment[] = [];
            const  messages = SegmentsValidator.validate(source, maxPpo, true);
            expect(messages.length).toBe(1);
        });

        it('No messages for valid segments.', () => {
            const first = new Segment(0, 30, air, 5);
            const next = new Segment(20, 20, air, 5);
            const source: Segment[] = [first, next];
            const  messages = SegmentsValidator.validate(source, maxPpo, true);
            expect(messages.length).toBe(0);
        });

        it('Gas isn`t breathable at bottom depths of segment', () => {
            const oxygen = new Gas(1, 0);
            const first = new Segment(20, 40, oxygen, 5);
            const source: Segment[] = [first];
            const  messages = SegmentsValidator.validate(source, maxPpo, true);
            expect(messages.length).toBe(1);
        });

        it('Gas isn`t breathable at ceiling depths of segment', () => {
            const first = new Segment(0, 30, trimix1070, 5);
            const source: Segment[] = [first];
            const  messages = SegmentsValidator.validate(source, maxPpo, true);
            console.log(messages.join(','));
            expect(messages.length).toBe(1);
        });
    });

    describe('Segments', () => {
        it('Merge flat segments', () => {
            const s1 = new Segment(0, 20, air, 15);
            const s2 = new Segment(20, 20, air, 15);
            const s3 = new Segment(20, 20, air, 35);
            const s4 = new Segment(20, 5, air, 35);
            const s5 = new Segment(5, 5, air, 3);
            const s6 = new Segment(5, 5, air, 3);
            const source = [s1, s2, s3, s4, s5, s6];
            const merged = Segments.mergeFlat(source);
            expect(merged.length).toBe(4);
        });

        it('Empty segments return empty array', () => {
            const merged = Segments.mergeFlat([]);
            expect(merged.length).toBe(0);
        });
    });

    describe('Segment', () => {
        it('Adds time from other segment', () => {
            const segment = new Segment(20, 20, air, 15);
            const segment2 = new Segment(20, 20, air, 35);
            segment.addTime(segment2);
            expect(segment.time).toBe(50);
        });

        it('Level equals for flat segments', () => {
            const segment = new Segment(20, 20, air, 15);
            const segment2 = new Segment(20, 20, air, 35);
            const equals = segment.levelEquals(segment2);
            expect(equals).toBeTrue();
        });

        describe('Doesn`t equal', () => {
            it('ascent segments', () => {
                const segment = new Segment(10, 20, air, 15);
                const segment2 = new Segment(10, 20, air, 35);
                const equals = segment.levelEquals(segment2);
                expect(equals).toBeFalse();
            });

            it('descent segments', () => {
                const segment = new Segment(20, 10, air, 15);
                const segment2 = new Segment(20, 10, air, 35);
                const equals = segment.levelEquals(segment2);
                expect(equals).toBeFalse();
            });

            it(' different gas', () => {
                const segment = new Segment(20, 10, air, 15);
                const ean50 = new Gas(0.5, 0);
                const segment2 = new Segment(20, 10, ean50, 35);
                const equals = segment.levelEquals(segment2);
                expect(equals).toBeFalse();
            });
        });
    });
});
