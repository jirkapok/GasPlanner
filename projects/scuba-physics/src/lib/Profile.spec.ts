import { Options } from './BuhlmannAlgorithm';
import { StandardGases } from './Gases';
import { EventType, ProfileEvents } from './Profile';
import { Segments } from './Segments';
import { Time } from './Time';

describe('Profile', () => {
    const options = new Options(1, 1, 1.4, 1.6, 30, true);

    describe('Events', () => {
        describe('Low ppO2', () => {
            it('User defines 10/70 at beginning of dive', () => {
                const segments = new Segments();
                segments.add(0, 30, StandardGases.trimix1070, Time.oneMinute);

                const events = ProfileEvents.fromProfile(1, segments.mergeFlat(), options);
                expect(events.items[0].type).toBe(EventType.lowPpO2);
            });

            it('Algorithm was unable to choose better gas than 10/70 at end of dive', () => {
                const segments = new Segments();
                segments.add(30, 0, StandardGases.trimix1070, 1 * Time.oneMinute);

                const events = ProfileEvents.fromProfile(0, segments.mergeFlat(), options);
                expect(events.items[0].type).toBe(EventType.lowPpO2);
            });

            it('Multilevel dive with 10/70', () => {
                const segments = new Segments();
                segments.add(0, 30, StandardGases.air, Time.oneMinute);
                segments.add(30, 3, StandardGases.trimix1070, Time.oneMinute);
                segments.add(3, 3, StandardGases.trimix1070, Time.oneMinute);
                segments.add(3, 10, StandardGases.trimix1070, Time.oneMinute);
                segments.add(10, 0, StandardGases.trimix1070, Time.oneMinute);

                // Profile:
                // \   _  /
                //  \s/ \/
                const events = ProfileEvents.fromProfile(4, segments.mergeFlat(), options);
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
                const events = ProfileEvents.fromProfile(3, segments.mergeFlat(), options);
                expect(events.items.length).toBe(2); // second is gas switch
                expect(events.items[0].type).toBe(EventType.lowPpO2);
            });
        });

        describe('High ppO2', () => {
            it('Adds high ppO2 event during decent only once', () => {
                const segments = new Segments();
                segments.add(0, 70, StandardGases.air, 3.5 * Time.oneMinute);
                segments.add(70, 70, StandardGases.air, 2 * Time.oneMinute);
                segments.add(70, 21, StandardGases.air, 2 * Time.oneMinute);

                // Profile:
                //   \   /
                //    \_/
                const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), options);
                expect(events.items.length).toBe(1);
                expect(events.items[0].type).toBe(EventType.highPpO2);
            });

            it('NO high PpO2 event is added, when deco ppO2 limit is used during automatically created ascent', () => {
                const segments = new Segments();
                segments.add(0, 40, StandardGases.air, 2 * Time.oneMinute);
                segments.add(40, 40, StandardGases.air, Time.oneMinute);
                segments.add(40, 21, StandardGases.air, Time.oneMinute);
                segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
                segments.add(21, 3, StandardGases.ean50, Time.oneMinute);
                segments.add(3, 3, StandardGases.ean50, Time.oneMinute);
                segments.add(3, 0, StandardGases.ean50, Time.oneMinute);

                // Profile:
                //  \       _/ safety stop
                //   \   s_/   switch
                //    \_/
                const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), options);
                expect(events.items.length).toBe(1);
                expect(events.items[0].type).toBe(EventType.gasSwitch);
            });

            it('User defined gas switch to high ppO2 at depth', () => {
                const segments = new Segments();
                segments.add(0, 20, StandardGases.air, Time.oneMinute);
                segments.add(20, 20, StandardGases.air, Time.oneMinute);
                segments.add(20, 20, StandardGases.ean50, Time.oneMinute);
                segments.add(20, 3, StandardGases.ean50, Time.oneMinute);

                // Profile:
                //    \_s_/
                const events = ProfileEvents.fromProfile(3, segments.mergeFlat(), options);
                expect(events.items.length).toBe(2); // last one is gas switch
                expect(events.items[0].type).toBe(EventType.highPpO2);
            });

            it('Multiple events are added for multilevel dives', () => {
                const segments = new Segments();
                segments.add(0, 20, StandardGases.ean50, Time.oneMinute);
                segments.add(20, 20, StandardGases.ean50, Time.oneMinute);
                segments.add(20, 15, StandardGases.ean50, Time.oneMinute);
                segments.add(15, 20, StandardGases.ean50, Time.oneMinute);
                segments.add(20, 3, StandardGases.ean50, Time.oneMinute);

                // Profile: high ppO2 reached during the descents
                //    \_/\_/
                const events = ProfileEvents.fromProfile(4, segments.mergeFlat(), options);
                expect(events.items.length).toBe(2);
                expect(events.items[0].type).toBe(EventType.highPpO2);
                expect(events.items[1].type).toBe(EventType.highPpO2);
            });
        });

        it('Adds gas switch event', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 21, StandardGases.air, Time.oneMinute);
            segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
            segments.add(21, 6, StandardGases.ean50, Time.oneMinute);

            const events = ProfileEvents.fromProfile(2, segments.mergeFlat(), options);

            expect(events.items[0]).toEqual({
                type: EventType.gasSwitch,
                timeStamp: 180,
                depth: 21,
                data: StandardGases.ean50
            });
        });
    });
});
