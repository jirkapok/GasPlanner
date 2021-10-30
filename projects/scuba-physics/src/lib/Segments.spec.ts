import { Segment, Segments, SegmentsValidator } from './Segments';
import { Gases, StandardGases } from './Gases';

describe('Segments', () => {

    describe('Segments validator', () => {
        const gases = new Gases();
        gases.addBottomGas(StandardGases.air);

        it('At least one segment is required', () => {
            const source = new Segments();
            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(1);
        });

        it('No messages for valid segments.', () => {
            const source = new Segments();
            source.add(0, 30, StandardGases.air, 5);
            // consider validation, that all segments are subsequent
            source.add(20, 20, StandardGases.air, 5);

            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(0);
        });

        it('Segment contains unregistered gas', () => {
            const source = new Segments();
            source.add(0, 30, StandardGases.air, 5);
            const noGases = new Gases();
            const messages = SegmentsValidator.validate(source, noGases);
            expect(messages.length).toBe(1);
        });
    });

    describe('Merge flat', () => {
        let segments: Segments;

        it('are merged', () => {
            segments = new Segments();
            segments.add(0, 20, StandardGases.air, 15);
            segments.add(20, 20, StandardGases.air, 15);
            segments.add(20, 20, StandardGases.air, 35);
            segments.add(20, 5, StandardGases.air, 35);
            segments.add(5, 5, StandardGases.air, 3);
            segments.add(5, 5, StandardGases.air, 3);
            const merged = segments.mergeFlat();
            expect(merged.length).toBe(4);
        });

        it('Empty segments return empty array', () => {
            segments = new Segments();
            const merged = segments.mergeFlat();
            expect(merged.length).toBe(0);
        });
    });

    describe('Segments merge', () => {
        it('Adds time from other segment', () => {
            const segment = new Segment(20, 20, StandardGases.air, 15);
            const segment2 = new Segment(20, 20, StandardGases.air, 35);
            segment.mergeFrom(segment2);
            expect(segment.duration).toBe(50);
        });

        describe('Speed equals', () => {
            it('flat segments', () => {
                const segment = new Segment(20, 20, StandardGases.air, 15);
                const segment2 = new Segment(20, 20, StandardGases.air, 35);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeTrue();
            });

            it('ascent segments', () => {
                const segment = new Segment(20, 10, StandardGases.air, 15);
                const segment2 = new Segment(10, 0, StandardGases.air, 15);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeTrue();
            });

            it('descent segments', () => {
                const segment = new Segment(20, 30, StandardGases.air, 15);
                const segment2 = new Segment(30, 40, StandardGases.air, 15);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeTrue();
            });
        });

        describe('Speed doesn\'t equal', () => {
            it('different ascent segments', () => {
                const segment = new Segment(10, 20, StandardGases.air, 15);
                const segment2 = new Segment(10, 20, StandardGases.air, 35);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeFalse();
            });

            it('different descent segments', () => {
                const segment = new Segment(20, 10, StandardGases.air, 15);
                const segment2 = new Segment(20, 10, StandardGases.air, 35);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeFalse();
            });

            it('different gas', () => {
                const segment = new Segment(20, 10, StandardGases.air, 15);
                const segment2 = new Segment(20, 10, StandardGases.ean50, 35);
                const equals = segment.contentEquals(segment2);
                expect(equals).toBeFalse();
            });
        });
    });

    describe('Items manipulation', () => {
        it('Items returns always new collection', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, 2);
            segments.add(20, 20, StandardGases.air, 18);
            expect(segments.items).not.toBe(segments.items);
        });

        it('Length returns managed collection items count', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, 2);
            segments.add(20, 20, StandardGases.air, 18);
            expect(segments.items.length).toBe(segments.length);
        });

        it('Remove items removes its item from managed collection', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, 2);
            const middle = segments.add(20, 20, StandardGases.air, 18);
            segments.add(20, 0, StandardGases.air, 10);
            segments.remove(middle);

            expect(segments.items.length).toBe(2);
        });
    });

    describe('Fix start depths', () => {
        let segments: Segments;
        let first: Segment;
        let middle: Segment;

        beforeEach(() => {
            segments = new Segments();
            first = segments.add(0, 20, StandardGases.air, 2);
            middle = segments.add(20, 30, StandardGases.air, 20);
            segments.add(30, 0, StandardGases.air, 10);
        });

        it('It is called for remove', () => {
            segments.remove(middle);

            expect(segments.last().startDepth).toBe(20);
        });

        it('Fixes element in middle', () => {
            middle.endDepth = 10;
            segments.fixStartDepths();

            expect(segments.last().startDepth).toBe(10);
        });

        it('Sets first element start depth to 0m', () => {
            first.startDepth = 30;
            segments.fixStartDepths();

            expect(first.startDepth).toBe(0);

        });

        it('Fixes max. depth', () => {
            middle.endDepth = 40;
            segments.fixStartDepths();

            expect(segments.maxDepth).toBe(40);
        });
    });

    describe('Average depth', () => {
        it('No elements = 0 meters', () => {
            const segments: Segment[] = [];
            const averageDepth = Segments.averageDepth(segments);

            expect(averageDepth).toBe(0);
        });

        it('One element returns the only one element depth', () => {
            const segments: Segment[] = [
                new Segment(10, 30, StandardGases.air, 60)
            ];

            const averageDepth = Segments.averageDepth(segments);
            expect(averageDepth).toBe(20);
        });

        it('Multiple elements count all elements', () => {
            const segments: Segment[] = [
                new Segment(0, 40, StandardGases.air, 60),
                new Segment(40, 40, StandardGases.air, 120),
                new Segment(40, 0, StandardGases.air, 60)
            ];

            const averageDepth = Segments.averageDepth(segments);
            expect(averageDepth).toBe(30);
        });
    });
});
