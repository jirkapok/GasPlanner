import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Salinity } from './pressure-converter';
import { Gases, StandardGases, Gas } from './Gases';
import { Options, SafetyStop } from './Options';
import { OptionExtensions } from './Options.spec';
import { Ceiling, EventType, Events, Event } from './Profile';
import { EventOptions, ProfileEvents } from './ProfileEvents';
import { Segment, Segments } from './Segments';
import { Time } from './Time';
import { Tank } from './Tanks';

describe('Profile Events', () => {

    const createEventOption = (startAscentIndex: number,
        profile: Segment[], ceilings: Ceiling[], profileOptions: Options): EventOptions => ({
        maxDensity: 50, // prevent event generation
        startAscentIndex: startAscentIndex,
        profile: profile,
        ceilings: ceilings,
        profileOptions: profileOptions
    });

    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    const emptyCeilings: Ceiling[] = [];
    beforeEach(() => {
        options.maxEND = 100; // to eliminate all other events
    });

    describe('Low ppO2', () => {
        it('User defines 10/70 at beginning of dive', () => {
            const segments = new Segments();
            segments.add(0, 30, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Algorithm was unable to choose better gas than 10/70 at end of dive', () => {
            const segments = new Segments();
            segments.add(30, 0, StandardGases.trimix1070, 1 * Time.oneMinute);

            const eventOptions = createEventOption(0, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
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
            const eventOptions = createEventOption(4, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
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
            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2); // second is gas switch
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Started dive with 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 4, StandardGases.trimix1070, Time.oneMinute);
            segments.add(4, 4, StandardGases.trimix1070, Time.oneMinute);
            segments.add(4, 0, StandardGases.oxygen, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2); // last one is gas switch
            expect(events.items[0].timeStamp).toBe(0);
            expect(events.items[0].depth).toBeCloseTo(0);
        });

        it('Gas switch to 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 3, StandardGases.air, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2); // last one is gas switch
            expect(events.items[0].timeStamp).toBe(180);
            expect(events.items[0].depth).toBeCloseTo(3);
        });

        it('Ascent to 3 m with 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, Time.oneMinute);
            segments.add(10, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2); // last one is gas switch
            expect(events.items[0].timeStamp).toBe(43);
            expect(events.items[0].depth).toBeCloseTo(8);
        });
    });

    describe('High ppO2', () => {
        it('No high ppO2 event for oxygen at 4 m', () => {
            const segments = new Segments();
            segments.add(0, 4, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(4, 4, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(4, 0, StandardGases.oxygen, Time.oneMinute * 1);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(0);
        });

        it('Adds high ppO2 event during decent only once', () => {
            const segments = new Segments();
            segments.add(0, 70, StandardGases.air, Time.oneMinute * 3.5);
            segments.add(70, 70, StandardGases.air, Time.oneMinute * 2);
            segments.add(70, 21, StandardGases.air, Time.oneMinute * 5);

            // Profile:
            //   \   /
            //    \_/
            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
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
            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
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
            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
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
            const eventOptions = createEventOption(4, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2);
            expect(events.items[0].type).toBe(EventType.highPpO2);
            expect(events.items[1].type).toBe(EventType.highPpO2);
        });

        it('Assigns correct depth and time for gas switch', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.ean50, Time.oneMinute * 3);
            segments.add(10, 10, StandardGases.oxygen, Time.oneMinute);
            segments.add(10, 0, StandardGases.oxygen, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2); // last one is gas switch
            expect(events.items[0].depth).toBe(10);
            expect(events.items[0].timeStamp).toBe(180);
        });

        it('Assigns correct depth and time during decent', () => {
            const segments = new Segments();
            segments.add(0, 2, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(2, 10, StandardGases.oxygen, Time.oneMinute * 4);
            segments.add(10, 0, StandardGases.oxygen, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(1);
            expect(events.items[0].depth).toBeCloseTo(4);
            expect(events.items[0].timeStamp).toBe(120);
        });
    });

    describe('Gas switch', () => {
        it('Adds event on deco stop', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, Time.oneMinute * 4);
            segments.add(40, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 21, StandardGases.air, Time.oneMinute * 3);
            segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
            segments.add(21, 6, StandardGases.ean50, Time.oneMinute * 2);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.gasSwitch, 480, 21, StandardGases.ean50)
            );
        });

        it('Adds event user defined switch at bottom', () => {
            const segments = new Segments();
            segments.add(0, 15, StandardGases.air, Time.oneMinute * 4);
            segments.add(15, 15, StandardGases.air, Time.oneMinute);
            segments.add(15, 15, StandardGases.ean50, Time.oneMinute * 1);
            segments.add(15, 15, StandardGases.ean50, Time.oneMinute);
            segments.add(15, 0, StandardGases.ean50, Time.oneMinute * 2);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.gasSwitch, 300, 15, StandardGases.ean50)
            );
        });

        it('User defined switch to another tank with the same gas', () => {
            const tank1 = Tank.createDefault();
            const tank2 = Tank.createDefault();

            const segments = new Segments();
            const s1 = segments.add(0, 15, StandardGases.air, Time.oneMinute * 4);
            s1.tank = tank1;
            const s2 = segments.add(15, 15, StandardGases.air, Time.oneMinute);
            s2.tank = tank1;
            const s3 = segments.add(15, 15, StandardGases.air, Time.oneMinute * 1);
            s3.tank = tank2;
            segments.add(15, 15, StandardGases.air, Time.oneMinute);
            segments.add(15, 0, StandardGases.air, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.gasSwitch, 300, 15, StandardGases.air)
            );
        });
    });

    describe('High speeds', () => {
        it('Adds high ascent speed', () => {
            const segments = new Segments();
            segments.add(0, 20, StandardGases.air, Time.oneMinute * 2);
            segments.add(20, 0, StandardGases.air, Time.oneMinute);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.highAscentSpeed, 120, 20)
            );
        });

        it('High ascent speed rounds precision', () => {
            const segments = new Segments();
            // using this formula javascript creates precise number 166.66666666666666 periodical
            const duration = (30 - 5) / 9 * Time.oneMinute;
            segments.add(30, 5, StandardGases.air, duration);

            const recommendedOptions = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
            recommendedOptions.ascentSpeed50perc = 9;
            const eventOptions = createEventOption(2, segments.items, emptyCeilings, recommendedOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(0);
        });

        it('Adds high descent speed', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, Time.oneMinute);
            segments.add(10, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 20);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.highDescentSpeed, 60, 10)
            );
        });
    });

    describe('Broken ceiling', () => {
        it('User defined segment breaks ceiling', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(30, StandardGases.air, 20 * Time.oneMinute);
            segments.add(30, 3, StandardGases.air, 4 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
            defaultOptions.safetyStop = SafetyStop.always;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            const firstError = events.items[0];

            // during this dive on second level we are already decompressing anyway,
            // so once the ceiling should be lower than current depth.
            expect(events.items.length).toBe(1);
            expect(firstError.type).toBe(EventType.brokenCeiling);
        });

        it('Long shallow dive doesn\'t break ceiling', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 16, StandardGases.air, 1.25 * Time.oneMinute);
            segments.addFlat(16, StandardGases.air, 118.75 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            defaultOptions.safetyStop = SafetyStop.always;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(0);
        });

        it('Broken ceiling is added multiple times', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(30, StandardGases.air, 25 * Time.oneMinute);
            segments.add(30, 6, StandardGases.air, 4 * Time.oneMinute);
            segments.addFlat(6, StandardGases.air, 2 * Time.oneMinute);
            segments.add(6, 2, StandardGases.air, 1.5 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            defaultOptions.safetyStop = SafetyStop.always;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(5, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(2);
        });
    });

    describe('ICD - Switch to higher N2 on deco dive', () => {
        it('from 18/45 to Ean50', () => {
            const segments = new Segments();
            segments.add(30, 21, StandardGases.trimix1845, Time.oneMinute * 3);
            segments.add(21, 21, StandardGases.ean50, Time.oneMinute);
            segments.add(21, 6, StandardGases.ean50, Time.oneMinute * 2);

            const ceilings: Ceiling[] = [
                new Ceiling(0, 0),
                new Ceiling(Time.oneMinute * 3, 0),
                new Ceiling(Time.oneMinute * 4, 1), // not a real dive we only need the ceiling
                new Ceiling(Time.oneMinute * 6, 0)
            ];

            const eventOptions = createEventOption(1, segments.items, ceilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(2); // first event is gas switch
            expect(events.items[1]).toEqual(
                Event.create(EventType.switchToHigherN2, Time.oneMinute * 3, 21, StandardGases.ean50)
            );
        });

        it('21/35 to 35/25 doesn\'t add the event', () => {
            const segments = new Segments();
            segments.add(0, 15, StandardGases.trimix2135, Time.oneMinute * 4);
            segments.add(15, 15, StandardGases.trimix2135, Time.oneMinute);
            segments.add(15, 0, StandardGases.trimix3525, Time.oneMinute * 6);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(1); // only the gas switch event
            expect(events.items[0].type).not.toEqual(EventType.switchToHigherN2);
        });

        it('doesn\'t add the event in case no helium in mixtures', () => {
            const segments = new Segments();
            segments.add(0, 15, StandardGases.ean50, Time.oneMinute * 4);
            segments.add(15, 15, StandardGases.ean50, Time.oneMinute);
            segments.add(15, 0, StandardGases.air, Time.oneMinute * 6);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(1); // only the gas switch event
            expect(events.items[0].type).not.toEqual(EventType.switchToHigherN2);
        });
    });

    describe('Maximum narcotic depth exceeded', () => {
        beforeEach(() => {
            options.maxEND = 30; // only for these tests
        });

        it('Switch to narcotic gas', () => {
            const segments = new Segments();
            segments.add(0, 45, StandardGases.trimix1845, Time.oneMinute * 4);
            segments.add(45, 45, StandardGases.trimix1845, Time.oneMinute);
            segments.add(45, 0, StandardGases.trimix3525, Time.oneMinute * 20);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(2);  // first event is gas switch
            expect(events.items[1]).toEqual(
                Event.create(EventType.maxEndExceeded, 300, 45, StandardGases.trimix3525)
            );
        });

        it('Swim deeper than gas narcotic depth', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, Time.oneMinute * 4);
            segments.add(40, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 20);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(1);// only one event for multiple segments
            expect(events.items[0]).toEqual(
                Event.create(EventType.maxEndExceeded, 240, 40, StandardGases.air)
            );
        });
    });

    describe('Gas density exceeded', () => {
        beforeEach(() => {
            options.maxEND = 50; // to remove narcosis event
        });

        const findProfileEvents = (maxDepth: number): Events => {
            const segments = new Segments();
            segments.add(0, maxDepth, StandardGases.air, Time.oneMinute * 4);
            segments.add(maxDepth, maxDepth, StandardGases.air, Time.oneMinute * 10);
            segments.add(maxDepth, 0, StandardGases.air, Time.oneMinute * 10);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            return events;
        };

        it('No event is generated for max. density', () => {
            const events = findProfileEvents(30);

            expect(events.items.length).toEqual(0);
        });

        it('Event is generated only once for max. density', () => {
            const events = findProfileEvents(40);

            expect(events.items.length).toEqual(1);
            expect(events.items[0]).toEqual(
                Event.create(EventType.highGasDensity, 240, 40, StandardGases.air)
            );
        });

        it('Gas switch to high density generates event', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.trimix2525, Time.oneMinute * 4);
            segments.add(40, 40, StandardGases.air, Time.oneMinute * 10);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 10);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(3); // gasswitch, idc, high density
            expect(events.items[2]).toEqual(
                Event.create(EventType.highGasDensity, 240, 40, StandardGases.air)
            );
        });
    });
});

