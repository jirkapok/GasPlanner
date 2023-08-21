import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Salinity } from './pressure-converter';
import { Gas, Gases, StandardGases } from './Gases';
import { Options, SafetyStop } from './Options';
import { OptionExtensions } from './Options.spec';
import { Ceiling, EventType, Events, Event } from './Profile';
import { EventOptions, ProfileEvents } from './ProfileEvents';
import { Segment, Segments } from './Segments';
import { Time } from './Time';
import { Tank } from './Tanks';
import { GasDensity } from './GasDensity';
import { Precision } from './precision';

interface EventAssert {
    depth: number;
    timeStamp: number;
    type: EventType;
    gas?: Gas;
}

describe('Profile Events', () => {

    const createEventOption = (startAscentIndex: number,
        profile: Segment[], ceilings: Ceiling[], profileOptions: Options): EventOptions => ({
            maxDensity: 50, // prevent event generation
            startAscentIndex: startAscentIndex,
            profile: profile,
            ceilings: ceilings,
            profileOptions: profileOptions
        });

    const assertEvents = (current: Event[], expected: EventAssert[]) => {
        const filtered: EventAssert[] = current.map(e => ({
            depth: Precision.round(e.depth, 2),
            timeStamp: Precision.round(e.timeStamp, 1),
            type: e.type,
            gas: e.gas
        }));
        expect(filtered).toEqual(expected);
    };

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
            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 8, timeStamp: 267, gas: undefined },
                { type: EventType.gasSwitch, depth: 30, timeStamp: 120, gas: StandardGases.trimix1070 },
                { type: EventType.lowPpO2, depth: 8, timeStamp: 432, gas: undefined },
            ]);
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

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 3, timeStamp: 120, gas: undefined },
                { type: EventType.gasSwitch, depth: 3, timeStamp: 120, gas: StandardGases.trimix1070 },
            ]);
        });

        it('Started dive with 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 4, StandardGases.trimix1070, Time.oneMinute);
            segments.add(4, 4, StandardGases.trimix1070, Time.oneMinute);
            segments.add(4, 0, StandardGases.oxygen, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 0, timeStamp: 0, gas: undefined },
                { type: EventType.gasSwitch, depth: 4, timeStamp: 120, gas: StandardGases.oxygen },
            ]);
        });

        it('Gas switch to 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 3, StandardGases.air, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 3, timeStamp: 180, gas: undefined },
                { type: EventType.gasSwitch, depth: 3, timeStamp: 180, gas: StandardGases.trimix1070 },
            ]);
        });

        it('Ascent to 3 m with 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, Time.oneMinute);
            segments.add(10, 3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(3, 0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 8, timeStamp: 77, gas: undefined },
                { type: EventType.gasSwitch, depth: 10, timeStamp: 60, gas: StandardGases.trimix1070 },
            ]);
        });
    });

    // TODO air, 30 m, 13 minutes (11.3 min descent) - results in deco event depth wrong value

    describe('High ppO2', () => {
        it('No high ppO2 event for oxygen at 4 m', () => {
            const segments = new Segments();
            segments.add(0, 4, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(4, 4, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(4, 0, StandardGases.oxygen, Time.oneMinute * 1);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items).toEqual([]);
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

            assertEvents(events.items, [
                { type: EventType.highPpO2, depth: 56.99, timeStamp: 171, gas: undefined },
            ]);
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

            assertEvents(events.items, [
                { type: EventType.gasSwitch, depth: 21, timeStamp: 300, gas: StandardGases.ean50 },
            ]);
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

            assertEvents(events.items, [
                { type: EventType.highPpO2, depth: 20, timeStamp: 120, gas: undefined },
                { type: EventType.gasSwitch, depth: 20, timeStamp: 120, gas: StandardGases.ean50 },
            ]);
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

            assertEvents(events.items, [
                { type: EventType.highPpO2, depth: 18, timeStamp: 54, gas: undefined },
                { type: EventType.highPpO2, depth: 18, timeStamp: 216, gas: undefined },
            ]);
        });

        it('Assigns correct depth and time for gas switch', () => {
            const segments = new Segments();
            segments.add(0, 10, StandardGases.ean50, Time.oneMinute * 3);
            segments.add(10, 10, StandardGases.oxygen, Time.oneMinute);
            segments.add(10, 0, StandardGases.oxygen, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.highPpO2, depth: 10, timeStamp: 180, gas: undefined },
                { type: EventType.gasSwitch, depth: 10, timeStamp: 180, gas: StandardGases.oxygen },
            ]);
        });

        it('Assigns correct depth and time during decent', () => {
            const segments = new Segments();
            segments.add(0, 2, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(2, 10, StandardGases.oxygen, Time.oneMinute * 4);
            segments.add(10, 0, StandardGases.oxygen, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.highPpO2, timeStamp: 120, depth: 4, gas: undefined }
            ]);
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
            defaultOptions.safetyStop = SafetyStop.never;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);

            // during this dive on second level we are already decompressing anyway,
            // so once the ceiling should be lower than current depth.
            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 743, depth: 30, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 1534, depth: 5.96, gas: undefined }
            ]);
        });

        it('Long shallow dive doesn\'t break ceiling', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 16, StandardGases.air, 1.25 * Time.oneMinute);
            segments.addFlat(16, StandardGases.air, 118.75 * Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            defaultOptions.safetyStop = SafetyStop.never;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(3, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 3444, depth: 16, gas: undefined }
            ]);
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

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 794, depth: 30, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 1850, depth: 7.01, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 2030, depth: 3.79, gas: undefined }
            ]);
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

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: Time.oneMinute * 4, depth: 27, gas: undefined },
                { type: EventType.gasSwitch, timeStamp: Time.oneMinute * 3, depth: 21, gas: StandardGases.ean50 },
                { type: EventType.switchToHigherN2, timeStamp: Time.oneMinute * 3, depth: 21, gas: StandardGases.ean50 }
            ]);
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

            assertEvents(events.items, [
                { type: EventType.gasSwitch, timeStamp: 300, depth: 45, gas: StandardGases.trimix3525 },
                { type: EventType.maxEndExceeded, depth: 32.08, timeStamp: 344.4, gas: StandardGases.trimix3525 },
            ]);
        });

        it('Swim deeper than gas narcotic depth', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, Time.oneMinute * 4);
            segments.add(40, 40, StandardGases.air, Time.oneMinute);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 20);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            // only one event for multiple segments
            assertEvents(events.items, [
                { type: EventType.maxEndExceeded, timeStamp: 180, depth: 30, gas: StandardGases.air }
            ]);
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
            eventOptions.maxDensity = GasDensity.recommendedMaximum;
            const events = ProfileEvents.fromProfile(eventOptions);
            return events;
        };

        it('No event is generated for max. density', () => {
            const events = findProfileEvents(30);

            expect(events.items.length).toEqual(0);
        });

        it('Event is generated only once for max. density', () => {
            const events = findProfileEvents(40);

            assertEvents(events.items, [
                { type: EventType.highGasDensity, timeStamp: 208.8, depth: 34.8, gas: StandardGases.air }
            ]);
        });

        it('Gas switch to high density generates event', () => {
            const segments = new Segments();
            segments.add(0, 40, StandardGases.trimix2525, Time.oneMinute * 4);
            segments.add(40, 40, StandardGases.air, Time.oneMinute * 10);
            segments.add(40, 0, StandardGases.air, Time.oneMinute * 10);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            eventOptions.maxDensity = GasDensity.recommendedMaximum;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(3); // gasswitch, idc, high density
            expect(events.items[2]).toEqual(
                Event.create(EventType.highGasDensity, 240, 40, StandardGases.air)
            );
        });
    });

    describe('Common events', () => {
        beforeEach(() => {
            options.maxEND = 50; // to remove narcosis event
        });

        it('Adds start of safety stop', () => {
            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, Time.oneMinute * 2);
            segments.add(30, 30, StandardGases.air, Time.oneMinute * 10);
            segments.add(30, 3, StandardGases.air, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.air, Time.oneMinute * 3);
            segments.add(3, 0, StandardGases.air, Time.oneMinute * 1);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            options.safetyStop = SafetyStop.always;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items).toEqual([
                Event.create(EventType.safetyStop, 900, 3),
            ]);
        });

        it('Safety stop not present event not created', () => {
            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, Time.oneMinute * 2);
            segments.add(30, 30, StandardGases.air, Time.oneMinute * 10);
            segments.add(30, 3, StandardGases.air, Time.oneMinute * 3);
            segments.add(3, 3, StandardGases.air, Time.oneMinute * 1);
            segments.add(3, 0, StandardGases.air, Time.oneMinute * 1);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            options.safetyStop = SafetyStop.always;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items).toEqual([]);
        });


        it('Adds end of NDL', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, Time.oneMinute * 3);
            segments.add(30, 30, StandardGases.air, Time.oneMinute * 12);
            segments.add(30, 0, StandardGases.air, Time.oneMinute * 4);

            const algorithm = new BuhlmannAlgorithm();
            const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
            defaultOptions.safetyStop = SafetyStop.never;
            const decoPlan = algorithm.calculateDecompression(defaultOptions, gases, segments);
            const eventOptions = createEventOption(5, decoPlan.segments, decoPlan.ceilings, defaultOptions);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items).toEqual([
                Event.create(EventType.noDecoEnd, 826, 30),
            ]);
        });
    });
});

