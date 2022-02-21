import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Salinity } from './depth-converter';
import { Gases, StandardGases } from './Gases';
import { SafetyStop } from './Options';
import { OptionExtensions } from './Options.spec';
import { Ceiling, EventType } from './Profile';
import { ProfileEvents } from './ProfileEvents';
import { Segments } from './Segments';
import { Time } from './Time';

describe('Profile Events', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    const emptyCeilings: Ceiling[] = [];

    describe('Low ppO2', () => {
        it('User defines 10/70 at beginning of dive', () => {
            const segments = new Segments();
            segments.add(0, 30, StandardGases.trimix1070, Time.oneMinute);

            const events = ProfileEvents.fromProfile(1, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Algorithm was unable to choose better gas than 10/70 at end of dive', () => {
            const segments = new Segments();
            segments.add(30, 0, StandardGases.trimix1070, 1 * Time.oneMinute);

            const events = ProfileEvents.fromProfile(0, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Multilevel dive with 10/70', () => {
            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, Time.oneMinute * 2);
            segments.add(30, 3, StandardGases.trimix1070, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 10, StandardGases.trimix1070, Time.oneMinute);
            segments.add(10, 0, StandardGases.trimix1070, Time.oneMinute);

            // Profile:
            // \   _  /
            //  \s/ \/
            const events = ProfileEvents.fromProfile(4, segments.mergeFlat(), emptyCeilings, options);
            // two assent crossings and gas switch
            expect(events.items.length).toBe(3);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
            expect(events.items[2].type).toBe(EventType.lowPpO2);
        });

        it('Gas switch to 10/70 at 3 m', () => {
            const segments = new Segments();
            segments.add(0, 3, StandardGases.air, Time.oneMinute);
            segments.add(3, 3, StandardGases.air, Time.oneMinute);
            segments.add(3, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 0, StandardGases.trimix1070, Time.oneMinute);

            // Profile:
            // \_ s_ /
            const events = ProfileEvents.fromProfile(3, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items.length).toBe(2); // second is gas switch
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });
    });

    describe('High ppO2', () => {
        it('Adds high ppO2 event during decent only once', () => {
            const segments = new Segments();
            segments.add(0, 70, StandardGases.air, Time.oneMinute * 3.5);
            segments.add(70, 70, StandardGases.air, Time.oneMinute * 2);
            segments.add(70, 21, StandardGases.air, Time.oneMinute * 5);

            // Profile:
            //   \   /
            //    \_/
            const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items.length).toBe(1);
            expect(events.items[0].type).toBe(EventType.highPpO2);
        });

        it('NO high PpO2 event is added, when deco ppO2 limit is used during automatically created ascent', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, Time.oneMinute * 2);
            segments.add(40, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 21, StandardGases.air, Time.oneMinute * 2);
            segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
            segments.add(21, 3, StandardGases.ean50, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.ean50, Time.oneMinute);
            segments.add(3, 0, StandardGases.ean50, Time.oneMinute);

            // Profile:
            //  \       _/ safety stop
            //   \   s_/   switch
            //    \_/
            const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items.length).toBe(1);
            expect(events.items[0].type).toBe(EventType.gasSwitch);
        });

        it('User defined gas switch to high ppO2 at depth', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, Time.oneMinute);
            segments.add(20, 20, StandardGases.air, Time.oneMinute);
            segments.add(20, 20, StandardGases.ean50, Time.oneMinute);
            segments.add(20, 3, StandardGases.ean50, Time.oneMinute * 2);

            // Profile:
            //    \_s_/
            const events = ProfileEvents.fromProfile(3, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items.length).toBe(2); // last one is gas switch
            expect(events.items[0].type).toBe(EventType.highPpO2);
        });

        it('Multiple events are added for multilevel dives', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.ean50, Time.oneMinute);
            segments.add(20, 20, StandardGases.ean50, Time.oneMinute);
            segments.add(20, 15, StandardGases.ean50, Time.oneMinute);
            segments.add(15, 20, StandardGases.ean50, Time.oneMinute);
            segments.add(20, 3, StandardGases.ean50, Time.oneMinute * 2);

            // Profile: high ppO2 reached during the descents
            //    \_/\_/
            const events = ProfileEvents.fromProfile(4, segments.mergeFlat(), emptyCeilings, options);
            expect(events.items.length).toBe(2);
            expect(events.items[0].type).toBe(EventType.highPpO2);
            expect(events.items[1].type).toBe(EventType.highPpO2);
        });
    });

    it('Adds gas switch event', () => {
        const segments = new Segments();
        segments.add(0, 40, StandardGases.air, Time.oneMinute * 4);
        segments.add(40, 40, StandardGases.air, Time.oneMinute);
        segments.add(40, 21, StandardGases.air, Time.oneMinute * 3);
        segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
        segments.add(21, 6, StandardGases.ean50, Time.oneMinute * 2);

        const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), emptyCeilings, options);

        expect(events.items[0]).toEqual({
            type: EventType.gasSwitch,
            timeStamp: 480,
            depth: 21,
            data: StandardGases.ean50
        });
    });

    describe('High speeds', () => {
        it('Adds high ascent speed', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, Time.oneMinute * 2);
            segments.add(20, 0, StandardGases.air, Time.oneMinute);

            const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), emptyCeilings, options);

            expect(events.items[0]).toEqual({
                type: EventType.highAscentSpeed,
                timeStamp: 120,
                depth: 20
            });
        });

        it('Adds high descent speed', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, Time.oneMinute);
            segments.add(10, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 20);

            const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), emptyCeilings, options);

            expect(events.items[0]).toEqual({
                type: EventType.highDescentSpeed,
                timeStamp: 60,
                depth: 10
            });
        });
    });

    describe('Broken ceiling', () => {
        it('User defined segment break ceiling', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(40, StandardGases.air, 20 * Time.oneMinute);
            segments.add(40, 10, StandardGases.air, 3 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
            defaultOptions.safetyStop = SafetyStop.always;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const events = ProfileEvents.fromProfile(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const firstError = events.items[0];

            // during this dive on second level we are already decompressing anyway,
            // so once the ceiling should be lower than current depth.
            expect(events.items.length).toBe(1);
            expect(firstError.type).toBe(EventType.brokenCeiling);
        });

        it('Doesn`t break ceiling', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 16, StandardGases.air, 1.25 * Time.oneMinute);
            segments.addFlat(16, StandardGases.air, 118.75 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            defaultOptions.safetyStop = SafetyStop.always;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const events = ProfileEvents.fromProfile(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            expect(events.items.length).toBe(0);
        });
    });
});
