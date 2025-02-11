import { Segment, Segments, SegmentsValidator } from './Segments';
import { Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';

describe('Segments', () => {

    describe('Segments validator', () => {
        const gases = new Gases();
        gases.add(StandardGases.air);

        it('At least one segment is required', () => {
            const source = new Segments();
            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(1);
        });

        it('No messages for valid segments.', () => {
            const source = new Segments();
            source.add(30, StandardGases.air, 5);
            // consider validation, that all segments are subsequent
            source.addFlat(StandardGases.air, 5);

            const  events = SegmentsValidator.validate(source, gases);
            expect(events.length).toBe(0);
        });

        it('Segment contains unregistered gas', () => {
            const source = new Segments();
            source.add(30, StandardGases.air, 5);
            const noGases = new Gases();
            const messages = SegmentsValidator.validate(source, noGases);
            expect(messages.length).toBe(1);
        });
    });

    describe('Merge flat', () => {
        let filledSegments: Segments;

        beforeEach(() => {
            filledSegments = new Segments();
            // use copy to enforce content comparison
            filledSegments.add(20, StandardGases.air.copy(), 15);
            filledSegments.addFlat(StandardGases.air.copy(), 15);
            filledSegments.addFlat(StandardGases.air.copy(), 35);
            filledSegments.add(5, StandardGases.air.copy(), 35);
            filledSegments.addFlat(StandardGases.air.copy(), 3);
            filledSegments.addFlat(StandardGases.air.copy(), 3);
        });


        it('are merged', () => {
            const merged = filledSegments.mergeFlat();
            expect(merged.length).toBe(4);
        });

        it('Empty segments return empty array', () => {
            const emptySegments = new Segments();
            const merged = emptySegments.mergeFlat();
            expect(merged.length).toBe(0);
        });

        it('Merge only segments after starting index', () => {
            const merged = filledSegments.mergeFlat(2);
            expect(merged.length).toBe(5);
        });

        it('Nothing is merged in case negative number of items to skip', () => {
            const merged = filledSegments.mergeFlat(-2);
            expect(merged.length).toBe(6);
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
            segments.add(20, StandardGases.air, 2);
            segments.addFlat(StandardGases.air, 18);
            expect(segments.items).not.toBe(segments.items);
        });

        it('Length returns managed collection items count', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 2);
            segments.addFlat(StandardGases.air, 18);
            expect(segments.items.length).toBe(segments.length);
        });

        it('Remove items removes its item from managed collection', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 2);
            const middle = segments.addFlat(StandardGases.air, 18);
            segments.add(0, StandardGases.air, 10);
            segments.remove(middle);

            expect(segments.items.length).toBe(2);
        });
    });

    describe('cutDown', () => {
        it('Empty makes no change', () => {
            const segments = new Segments();
            segments.cutDown(1);
            expect(segments.length).toBe(0);
        });

        it('Remove more than in the array clears all', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 2);
            segments.addFlat(StandardGases.air, 18);
            segments.cutDown(5);
            expect(segments.length).toBe(0);
        });

        it('Remove one removes only last', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 2);
            segments.addFlat(StandardGases.air, 18);
            segments.cutDown(1);
            expect(segments.length).toBe(1);
        });

        it('Remove multiple removes them from end', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 2);
            segments.addFlat(StandardGases.air, 18);
            segments.addFlat(StandardGases.air, 18);
            segments.cutDown(2);
            expect(segments.length).toBe(1);
        });
    });

    describe('Fix start depths', () => {
        let segments: Segments;
        let first: Segment;
        let middle: Segment;

        beforeEach(() => {
            segments = new Segments();
            first = segments.add(20, StandardGases.air, 2);
            middle = segments.add(30, StandardGases.air, 20);
            segments.add(0, StandardGases.air, 10);
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

        it('0 duration is not added', () => {
            const segments: Segment[] = [
                new Segment(40, 40, StandardGases.air, 0),
                new Segment(40, 40, StandardGases.air, 60)
            ];

            const averageDepth = Segments.averageDepth(segments);
            expect(averageDepth).toBe(40);
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

    describe('Deepest part', () => {
        it('No elements = empty result', () => {
            const segments = new Segments();
            const deepestPart = segments.deepestPart();
            expect(deepestPart.length).toBe(0);
        });

        it('Last segment is deepest', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 1);
            segments.add(40, StandardGases.air, 1);
            const deepestPart = segments.deepestPart();
            expect(deepestPart.length).toBe(2);
        });

        it('First segment is deepest', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.air, 1);
            segments.add(20, StandardGases.air, 1);
            const deepestPart = segments.deepestPart();
            expect(deepestPart.length).toBe(1);
        });

        it('Flat after deepest', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.air, 1);
            segments.addFlat(StandardGases.air, 1);
            segments.addFlat(StandardGases.air, 1);
            segments.addFlat(StandardGases.air, 1);
            segments.add(20, StandardGases.air, 1);
            const deepestPart = segments.deepestPart();
            expect(deepestPart.length).toBe(4);
        });

        it('First deepest segments in Multi level', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, 1);
            segments.add(40, StandardGases.air, 1);
            segments.add(20, StandardGases.air, 1);
            segments.add(40, StandardGases.air, 1);
            segments.add(20, StandardGases.air, 1);
            const deepestPart = segments.deepestPart();
            expect(deepestPart.length).toBe(4);
        });
    });

    describe('Start ascent', () => {
        const irrelevantGas = StandardGases.air;

        it('No elements = no time', () => {
            const segments = new Segments();
            expect(segments.startAscentTime).toBe(0);
        });

        it('Simple dive = last segment', () => {
            const segments = new Segments();
            segments.add(10, irrelevantGas, 30);
            segments.addFlat(irrelevantGas, 40);
            expect(segments.startAscentTime).toBe(70);
        });

        it('Multilevel dive = deepest segment', () => {
            const segments = new Segments();
            segments.add(20, irrelevantGas, 10);
            segments.addFlat(irrelevantGas, 40);
            segments.add(5, irrelevantGas, 50);
            segments.addFlat(irrelevantGas, 60);
            segments.add(10, irrelevantGas, 70);
            segments.addFlat(irrelevantGas, 80);
            expect(segments.startAscentTime).toBe(50);
        });

        it('Plan up to surface = deepest segment', () => {
            const segments = new Segments();
            segments.add(20, irrelevantGas, 10);
            segments.addFlat(irrelevantGas, 50);
            segments.add(5, irrelevantGas, 20);
            segments.addFlat(irrelevantGas, 30);
            segments.add(0, irrelevantGas, 40);
            expect(segments.startAscentTime).toBe(60);
        });
    });

    describe('Depth at', () => {
        const profile = [
            new Segment(5, 10, StandardGases.air, 20), // 5 m to distinguish from default 0 m
            new Segment(10, 20, StandardGases.air, 20),
            new Segment(20, 30, StandardGases.air, 20)
        ];

        it('No elements returns 0 m', () => {
            const depth = Segments.depthAt([], 0);
            expect(depth).toEqual(0);
        });

        it('0 s runtime returns start depth', () => {
            const depth = Segments.depthAt(profile, 0);
            expect(depth).toEqual(5);
        });

        it('Runtime from an element returns depth 15 meters', () => {
            const depth = Segments.depthAt(profile, 30);
            expect(depth).toEqual(15);
        });

        it('End runtime returns end depth', () => {
            const depth = Segments.depthAt(profile, 60);
            expect(depth).toEqual(30);
        });

        it('Runtime outside of the depths returns 0 m', () => {
            const depth = Segments.depthAt(profile, 70);
            expect(depth).toEqual(0);
        });
    });
});
