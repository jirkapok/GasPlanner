import { EventOptions, ProfileEvents } from './ProfileEvents';
import { EventType } from './CalculatedProfile';
import { OptionExtensions } from './Options.spec';
import { Segments } from '../depths/Segments';
import { Gas } from '../gases/Gases';
import { DepthConverterFactory } from '../physics/depth-converter';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { PscrBreathing } from '../ccr/PscrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';

describe('Profile events - pSCR', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.maxEND = 100; // to eliminate narcosis events
    const pscr = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, new DepthConverterFactory(options).create());

    const lowPpO2Events = (segments: Segments): number => {
        const eventOptions: EventOptions = {
            maxDensity: 50, // prevent density events
            startAscentIndex: 2,
            profile: segments.items,
            ceilings: [],
            profileOptions: options,
            breathing: pscr
        };
        return ProfileEvents.fromProfile(eventOptions).items.filter(e => e.type === EventType.lowPpO2).length;
    };

    const dive = (gas: Gas): Segments => {
        const segments = new Segments();
        segments.add(30, gas, Time.oneMinute * 2);
        segments.addFlat(gas, Time.oneMinute * 20);
        segments.add(0, gas, Time.oneMinute * 4);
        return segments;
    };

    it('hypoxic loop on air supply is reported', () => {
        expect(lowPpO2Events(dive(StandardGases.air))).toBeGreaterThan(0);
    });

    it('hypoxic loop is reported again only after it recovers', () => {
        // air supply loop is hypoxic close to surface, but at 30 m the loop ppO2 is about 0.48
        // so reported at start of descent and during the final ascent
        expect(lowPpO2Events(dive(StandardGases.air))).toBe(2);
    });

    it('rich supply gas at depth has no hypoxic loop', () => {
        const segments = new Segments();
        segments.add(30, StandardGases.ean50, Time.oneMinute * 2);
        segments.addFlat(StandardGases.ean50, Time.oneMinute * 20);
        segments.items[0].startDepth = 30; // skip the descent from surface, where every loop is lean
        expect(lowPpO2Events(segments)).toBe(0);
    });
});
