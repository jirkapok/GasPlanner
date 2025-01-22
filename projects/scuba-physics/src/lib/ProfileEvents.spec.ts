import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Salinity } from './pressure-converter';
import { Gas, Gases } from './Gases';
import { Options, SafetyStop } from './Options';
import { OptionExtensions } from './Options.spec';
import { Ceiling, EventType, Events, Event } from './CalculatedProfile';
import { EventOptions, ProfileEvents } from './ProfileEvents';
import { Segment, Segments } from './Segments';
import { Time } from './Time';
import { Tank } from './Tanks';
import { GasDensity } from './GasDensity';
import { Precision } from './precision';
import { StandardGases } from './StandardGases';
import { AlgorithmParams } from "./BuhlmannAlgorithmParameters";

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

    const calculateEvents = (gases: Gases, segments: Segments, salinity: Salinity, safetyStop: SafetyStop): Events => {
        const defaultOptions = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, salinity);
        defaultOptions.safetyStop = safetyStop;
        return calculateEventsByOptions(gases, segments, defaultOptions);
    };

    const calculateEventsByOptions = (gases: Gases, segments: Segments, algorithmOptions: Options): Events => {
        const algorithm = new BuhlmannAlgorithm();
        const parameters = AlgorithmParams.forMultilevelDive(segments, gases, algorithmOptions);
        const decoPlan = algorithm.decompression(parameters);
        const eventOptions = createEventOption(3, decoPlan.segments, decoPlan.ceilings, algorithmOptions);
        const events = ProfileEvents.fromProfile(eventOptions);
        return events;
    };

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
            segments.add(30, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Algorithm was unable to choose better gas than 10/70 at end of dive', () => {
            const segments = new Segments();
            segments.add(30, StandardGases.trimix1070, 1 * Time.oneMinute);
            segments.add(0, StandardGases.trimix1070, 1 * Time.oneMinute);

            const eventOptions = createEventOption(0, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items[0].type).toBe(EventType.lowPpO2);
        });

        it('Multilevel dive with 10/70', () => {
            const segments = new Segments();
            segments.add(30, StandardGases.air, Time.oneMinute * 2);
            segments.add(3, StandardGases.trimix1070, Time.oneMinute * 3);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute);
            segments.add(10, StandardGases.trimix1070, Time.oneMinute);
            segments.add(0, StandardGases.trimix1070, Time.oneMinute);

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
            segments.add(3, StandardGases.air, Time.oneMinute);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute);
            segments.add(0, StandardGases.trimix1070, Time.oneMinute);

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
            segments.add(4, StandardGases.trimix1070, Time.oneMinute);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute);
            segments.add(0, StandardGases.oxygen, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 0, timeStamp: 0, gas: undefined },
                { type: EventType.gasSwitch, depth: 4, timeStamp: 120, gas: StandardGases.oxygen },
            ]);
        });

        it('Gas switch to 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(3, StandardGases.air, Time.oneMinute * 3);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute);
            segments.add(0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 3, timeStamp: 180, gas: undefined },
                { type: EventType.gasSwitch, depth: 3, timeStamp: 180, gas: StandardGases.trimix1070 },
            ]);
        });

        it('Ascent to 3 m with 10/70 assigns correct depth and time', () => {
            const segments = new Segments();
            segments.add(10, StandardGases.air, Time.oneMinute);
            segments.add(3, StandardGases.trimix1070, Time.oneMinute);
            segments.add(0, StandardGases.trimix1070, Time.oneMinute);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, depth: 8, timeStamp: 77, gas: undefined },
                { type: EventType.gasSwitch, depth: 10, timeStamp: 60, gas: StandardGases.trimix1070 },
            ]);
        });
    });

    describe('High ppO2', () => {
        it('No high ppO2 event for oxygen at 4 m', () => {
            const segments = new Segments();
            segments.add(4, StandardGases.oxygen, Time.oneMinute * 1);
            segments.addFlat(StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(0, StandardGases.oxygen, Time.oneMinute * 1);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items).toEqual([]);
        });

        it('Adds high ppO2 event during decent only once', () => {
            const segments = new Segments();
            segments.add(70, StandardGases.air, Time.oneMinute * 3.5);
            segments.addFlat(StandardGases.air, Time.oneMinute * 2);
            segments.add(21, StandardGases.air, Time.oneMinute * 5);

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
            segments.add(40, StandardGases.air, Time.oneMinute * 2);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.add(21, StandardGases.air, Time.oneMinute * 2);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(3, StandardGases.ean50, Time.oneMinute * 3);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(0, StandardGases.ean50, Time.oneMinute);

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
            segments.add(20, StandardGases.air, Time.oneMinute);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(3, StandardGases.ean50, Time.oneMinute * 2);

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
            segments.add(20, StandardGases.ean50, Time.oneMinute);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(15, StandardGases.ean50, Time.oneMinute);
            segments.add(20, StandardGases.ean50, Time.oneMinute);
            segments.add(3, StandardGases.ean50, Time.oneMinute * 2);

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
            segments.add(10, StandardGases.ean50, Time.oneMinute * 3);
            segments.addFlat(StandardGases.oxygen, Time.oneMinute);
            segments.add(0, StandardGases.oxygen, Time.oneMinute * 2);

            const eventOptions = createEventOption(3, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.highPpO2, depth: 10, timeStamp: 180, gas: undefined },
                { type: EventType.gasSwitch, depth: 10, timeStamp: 180, gas: StandardGases.oxygen },
            ]);
        });

        it('Assigns correct depth and time during decent', () => {
            const segments = new Segments();
            segments.add(2, StandardGases.oxygen, Time.oneMinute * 1);
            segments.add(10, StandardGases.oxygen, Time.oneMinute * 4);
            segments.add(0, StandardGases.oxygen, Time.oneMinute * 2);

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
            segments.add(40, StandardGases.air, Time.oneMinute * 4);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.add(21, StandardGases.air, Time.oneMinute * 3);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(6, StandardGases.ean50, Time.oneMinute * 2);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items[0]).toEqual(
                Event.create(EventType.gasSwitch, 480, 21, StandardGases.ean50)
            );
        });

        it('Adds event user defined switch at bottom', () => {
            const segments = new Segments();
            segments.add(15, StandardGases.air, Time.oneMinute * 4);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.addFlat(StandardGases.ean50, Time.oneMinute * 1);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(0, StandardGases.ean50, Time.oneMinute * 2);

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
            segments.add(15, tank1, Time.oneMinute * 4);
            segments.addFlat(tank1, Time.oneMinute);
            segments.addFlat(tank2, Time.oneMinute * 1);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.add(0, StandardGases.air, Time.oneMinute * 2);

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
            segments.add(20, StandardGases.air, Time.oneMinute * 2);
            segments.add(0, StandardGases.air, Time.oneMinute);

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
            segments.add(30, StandardGases.air, duration);
            segments.add(5, StandardGases.air, duration);

            const recommendedOptions = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
            recommendedOptions.ascentSpeed50perc = 9;
            const eventOptions = createEventOption(2, segments.items, emptyCeilings, recommendedOptions);
            const events = ProfileEvents.fromProfile(eventOptions);
            expect(events.items.length).toBe(0);
        });

        it('Adds high descent speed', () => {
            const segments = new Segments();
            segments.add(10, StandardGases.air, Time.oneMinute);
            segments.add(40, StandardGases.air, Time.oneMinute);
            segments.add(0, StandardGases.air, Time.oneMinute * 20);

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
            segments.add(30, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 20 * Time.oneMinute);
            segments.add(3, StandardGases.air, 4 * Time.oneMinute);

            const events = calculateEvents(gases, segments, Salinity.salt, SafetyStop.never);

            // during this dive on second level we are already decompressing anyway,
            // so once the ceiling should be lower than current depth.
            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 778, depth: 30, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 1545, depth: 4.72, gas: undefined }
            ]);
        });

        it('Long shallow dive doesn\'t break ceiling', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(16, StandardGases.air, 1.25 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 118.75 * Time.oneMinute);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 3746, depth: 16, gas: undefined }
            ]);
        });

        it('Broken ceiling is added multiple times', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(30, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 25 * Time.oneMinute);
            segments.add(6, StandardGases.air, 4 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 2 * Time.oneMinute);
            segments.add(2, StandardGases.air, 1.5 * Time.oneMinute);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.always);

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 836, depth: 30, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 1856, depth: 6.44, gas: undefined },
                { type: EventType.brokenCeiling, timeStamp: 2051, depth: 2.85, gas: undefined }
            ]);
        });
    });

    describe('ICD - Switch to higher N2 on deco dive', () => {
        it('from 18/45 to Ean50', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1845);
            gases.add(StandardGases.ean50);

            const segments = new Segments();
            segments.add(30, StandardGases.trimix1845, Time.oneMinute * 2);
            segments.addFlat(StandardGases.trimix1845, Time.oneMinute * 10);
            segments.add(21, StandardGases.trimix1845, Time.oneMinute * 2);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(6, StandardGases.ean50, Time.oneMinute * 2);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 572, depth: 30, gas: undefined },
                { type: EventType.gasSwitch, timeStamp: Time.oneMinute * 14, depth: 21, gas: StandardGases.ean50 },
                { type: EventType.isobaricCounterDiffusion, timeStamp: Time.oneMinute * 14, depth: 21, gas: StandardGases.ean50 }
            ]);
        });

        it('21/35 to 35/25 doesn\'t add the event', () => {
            const segments = new Segments();
            segments.add(15, StandardGases.trimix2135, Time.oneMinute * 4);
            segments.addFlat(StandardGases.trimix2135, Time.oneMinute);
            segments.add(0, StandardGases.trimix3525, Time.oneMinute * 6);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(1); // only the gas switch event
            expect(events.items[0].type).not.toEqual(EventType.isobaricCounterDiffusion);
        });

        it('doesn\'t add the event in case no helium in mixtures', () => {
            const segments = new Segments();
            segments.add(15, StandardGases.ean50, Time.oneMinute * 4);
            segments.addFlat(StandardGases.ean50, Time.oneMinute);
            segments.add(0, StandardGases.air, Time.oneMinute * 6);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(1); // only the gas switch event
            expect(events.items[0].type).not.toEqual(EventType.isobaricCounterDiffusion);
        });
    });

    describe('Maximum narcotic depth exceeded', () => {
        beforeEach(() => {
            options.maxEND = 30; // only for these tests
        });

        it('Switch to narcotic gas', () => {
            const segments = new Segments();
            segments.add(45, StandardGases.trimix1845, Time.oneMinute * 4);
            segments.addFlat(StandardGases.trimix3525, Time.oneMinute);
            segments.add(0, StandardGases.trimix3525, Time.oneMinute * 20);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.gasSwitch, timeStamp: 240, depth: 45, gas: StandardGases.trimix3525 },
                { type: EventType.maxEndExceeded, timeStamp: 240, depth: 45, gas: StandardGases.trimix3525 },
            ]);
        });

        it('Switch to narcotic gas ascending', () => {
            const segments = new Segments();
            segments.add(45, StandardGases.trimix1845, Time.oneMinute * 4);
            segments.addFlat(StandardGases.trimix1845, Time.oneMinute);
            segments.add(0, StandardGases.trimix3525, Time.oneMinute * 20);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            assertEvents(events.items, [
                { type: EventType.gasSwitch, timeStamp: 300, depth: 45, gas: StandardGases.trimix3525 },
                { type: EventType.maxEndExceeded, timeStamp: 300, depth: 45, gas: StandardGases.trimix3525 },
            ]);
        });

        it('Swim deeper than gas narcotic depth', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.air, Time.oneMinute * 4);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.add(0, StandardGases.air, Time.oneMinute * 20);

            const eventOptions = createEventOption(2, segments.items, emptyCeilings, options);
            const events = ProfileEvents.fromProfile(eventOptions);

            // only one event for multiple segments
            assertEvents(events.items, [
                { type: EventType.maxEndExceeded, timeStamp: 180, depth: 30, gas: StandardGases.air }
            ]);
        });

        it('Swim deeper multiple segments than gas narcotic depth', () => {
            const segments = new Segments();
            segments.add(20, StandardGases.air, Time.oneMinute * 2);
            segments.add(40, StandardGases.air, Time.oneMinute * 2);
            segments.addFlat(StandardGases.air, Time.oneMinute);
            segments.add(0, StandardGases.air, Time.oneMinute * 20);

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
            segments.add(maxDepth, StandardGases.air, Time.oneMinute * 4);
            segments.addFlat(StandardGases.air, Time.oneMinute * 10);
            segments.add(0, StandardGases.air, Time.oneMinute * 10);

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
            segments.add(40, StandardGases.trimix2525, Time.oneMinute * 4);
            segments.addFlat(StandardGases.air, Time.oneMinute * 10);
            segments.add(0, StandardGases.air, Time.oneMinute * 10);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            eventOptions.maxDensity = GasDensity.recommendedMaximum;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(3); // gas switch, idc, high density
            expect(events.items[2]).toEqual(
                Event.create(EventType.highGasDensity, 240, 40, StandardGases.air)
            );
        });

        it('Gas switch to high density ascent', () => {
            const segments = new Segments();
            segments.add(40, StandardGases.trimix2525, Time.oneMinute * 4);
            segments.add(0, StandardGases.air, Time.oneMinute * 4);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            eventOptions.maxDensity = GasDensity.recommendedMaximum;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items.length).toEqual(3); // gas switch, idc, high density
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
            segments.add(30, StandardGases.air, Time.oneMinute * 2);
            segments.addFlat(StandardGases.air, Time.oneMinute * 10);
            segments.add(3, StandardGases.air, Time.oneMinute * 3);
            segments.addFlat(StandardGases.air, Time.oneMinute * 3);
            segments.add(0, StandardGases.air, Time.oneMinute * 1);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            options.safetyStop = SafetyStop.always;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items).toEqual([
                Event.create(EventType.safetyStop, 900, 3),
            ]);
        });

        it('Safety stop not present event not created', () => {
            const segments = new Segments();
            segments.add(30, StandardGases.air, Time.oneMinute * 2);
            segments.addFlat(StandardGases.air, Time.oneMinute * 10);
            segments.add(3, StandardGases.air, Time.oneMinute * 3);
            segments.addFlat(StandardGases.air, Time.oneMinute * 1);
            segments.add(0, StandardGases.air, Time.oneMinute * 1);

            const eventOptions = createEventOption(1, segments.items, emptyCeilings, options);
            options.safetyStop = SafetyStop.always;
            const events = ProfileEvents.fromProfile(eventOptions);

            expect(events.items).toEqual([]);
        });

        it('Adds end of NDL', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(30, StandardGases.air, Time.oneMinute * 3);
            segments.addFlat(StandardGases.air, Time.oneMinute * 12);
            segments.add(0, StandardGases.air, Time.oneMinute * 4);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            expect(events.items).toEqual([
                Event.create(EventType.noDecoEnd, 868, 30),
            ]);
        });

        it('Adds end of NDL during ascent with correct depth', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(30, StandardGases.air, 102);
            segments.addFlat(StandardGases.air, 690);
            segments.add(0, StandardGases.air, Time.oneMinute * 4);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            assertEvents(events.items, [
                { type: EventType.noDecoEnd, timeStamp: 870, depth: 20.25, gas: undefined },
            ]);
        });
    });

    describe('Algorithm limits', () => {
        it('Minimum depth bellow 9 meters with long exposures aren`t tested', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(5, StandardGases.air, Time.oneMinute * 10);
            segments.addFlat(StandardGases.air, Time.oneHour * 10);
            segments.add(0, StandardGases.air, Time.oneMinute);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            expect(events.items).toEqual([
                Event.create(EventType.minDepth, 0, 5),
            ]);
        });

        it('Maximum depth higher than 120 meters aren`t tested', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1070);

            const segments = new Segments();
            segments.add(130, StandardGases.trimix1070, Time.oneMinute * 10);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute);
            // don't care about the decompression
            segments.add(0, StandardGases.trimix1070, Time.oneMinute * 50);

            const events = calculateEvents(gases, segments, Salinity.fresh, SafetyStop.never);

            // simplify the test by ignoring all other events
            expect(events.items[6]).toEqual(
                Event.create(EventType.maxDepth, 0, 130)
            );
        });
    });

    describe('Air breaks', () => {
        const generateProfileEvents = (airBreaksEnabled: boolean) =>{
            const gases = new Gases();
            gases.add(StandardGases.trimix1070);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(60, StandardGases.trimix1070, 360);
            segments.addFlat(StandardGases.trimix1070, 600);
            segments.add(30, StandardGases.trimix1070, 240);
            segments.add(15, StandardGases.trimix1070, 1800);
            segments.add(6, StandardGases.trimix1070, 3600);
            segments.addFlat(StandardGases.oxygen, 1500);
            segments.add(0, StandardGases.oxygen, 360);

            const algorithmOptions = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
            algorithmOptions.airBreaks.enabled = airBreaksEnabled;
            return calculateEventsByOptions(gases, segments, algorithmOptions);
        };

        it('Adds warning even Disabled air breaks', () => {
            const events = generateProfileEvents(false);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, timeStamp: 0, depth: 0, gas: undefined },
                { type: EventType.noDecoEnd, timeStamp: 335, depth: 55.83, gas: undefined },
                { type: EventType.lowPpO2, timeStamp: 5800, depth: 8, gas: undefined },
                { type: EventType.gasSwitch, timeStamp: 6600, depth: 6, gas: StandardGases.oxygen },
                { type: EventType.missingAirBreak, timeStamp: 6620, depth: 6, gas: undefined }
            ]);
        });

        it('No bottom gas Adds warning', () => {
            const events = generateProfileEvents(true);

            assertEvents(events.items, [
                { type: EventType.lowPpO2, timeStamp: 0, depth: 0, gas: undefined },
                { type: EventType.noDecoEnd, timeStamp: 335, depth: 55.83, gas: undefined },
                { type: EventType.lowPpO2, timeStamp: 5800, depth: 8, gas: undefined },
                { type: EventType.gasSwitch, timeStamp: 6600, depth: 6, gas: StandardGases.oxygen },
                { type: EventType.missingAirBreak, timeStamp: 6620, depth: 6, gas: undefined }
            ]);
        });
    });
});

