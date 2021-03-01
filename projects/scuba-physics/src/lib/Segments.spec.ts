import { Segment, Segments, SegmentsValidator } from './Segments';
import { Gas, Gases } from './Gases';
import { DepthConverter } from './depth-converter';

describe('Segments', () => {
    const air = new Gas(0.21, 0); // 65.5m - 0m
    const trimix1070 = new Gas(0.1, 0.7);  // 148.5m - 7.9m
    const maxPpo = 1.6;

    describe('Segments validator', () => {
        const depthConverter = DepthConverter.forFreshWater();
        const gases = new Gases();
        gases.addBottomGas(air);

        it('At least one segment is required', () => {
            const source = new Segments();
            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(1);
        });

        it('No messages for valid segments.', () => {
            const source = new Segments();
            source.add(0, 30, air, 5);
            // consider validation, that all segments are subsequent
            source.add(20, 20, air, 5); 

            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(0);
        });

        it('Segment contains unregistered gas', () => {
            const source = new Segments();
            source.add(0, 30, air, 5);
            const noGases = new Gases();
            const messages = SegmentsValidator.validate(source, noGases);
            expect(messages.length).toBe(1);
        });
    });

    describe('Segments', () => {
        it('Merge flat segments', () => {
            const segments = new Segments();
            segments.add(0, 20, air, 15);
            segments.add(20, 20, air, 15);
            segments.add(20, 20, air, 35);
            segments.add(20, 5, air, 35);
            segments.add(5, 5, air, 3);
            segments.add(5, 5, air, 3);
            const merged = segments.mergeFlat();
            expect(merged.length).toBe(4);
        });

        it('Empty segments return empty array', () => {
            const segments = new Segments();
            const merged = segments.mergeFlat();
            expect(merged.length).toBe(0);
        });
    });

    describe('Segments merge', () => {
        it('Adds time from other segment', () => {
            const segment = new Segment(20, 20, air, 15);
            const segment2 = new Segment(20, 20, air, 35);
            segment.mergeFrom(segment2);
            expect(segment.duration).toBe(50);
        });

        describe('Speed equals', () => {
            it('flat segments', () => {
                const segment = new Segment(20, 20, air, 15);
                const segment2 = new Segment(20, 20, air, 35);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeTrue();
            });

            it('ascent segments', () => {
                const segment = new Segment(20, 10, air, 15);
                const segment2 = new Segment(10, 0, air, 15);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeTrue();
            });

            it('descent segments', () => {
                const segment = new Segment(20, 30, air, 15);
                const segment2 = new Segment(30, 40, air, 15);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeTrue();
            });
        });

        describe('Speed Doesn`t equal', () => {
            it('different ascent segments', () => {
                const segment = new Segment(10, 20, air, 15);
                const segment2 = new Segment(10, 20, air, 35);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeFalse();
            });

            it('different descent segments', () => {
                const segment = new Segment(20, 10, air, 15);
                const segment2 = new Segment(20, 10, air, 35);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeFalse();
            });

            it('different gas', () => {
                const segment = new Segment(20, 10, air, 15);
                const ean50 = new Gas(0.5, 0);
                const segment2 = new Segment(20, 10, ean50, 35);
                const equals = segment.speedEquals(segment2);
                expect(equals).toBeFalse();
            });
        });
    });
});
