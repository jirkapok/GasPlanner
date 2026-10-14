import { EventOptions, ProfileEvents } from './ProfileEvents';
import { EventType } from './CalculatedProfile';
import { OptionExtensions } from './Options.spec';
import { Segments } from '../depths/Segments';
import { Gas } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';

describe('Profile events - Breathing model', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.maxEND = 30;
    const openCircuit = OptionExtensions.openCircuit(options);

    const eventTypes = (gas: Gas, maxDensity: number): EventType[] => {
        const segments = new Segments();
        segments.add(60, gas, Time.oneMinute * 3);
        segments.addFlat(gas, Time.oneMinute * 10);
        const eventOptions: EventOptions = {
            maxDensity: maxDensity,
            startAscentIndex: 2,
            profile: segments.items,
            ceilings: [],
            profileOptions: options,
            breathing: openCircuit
        };
        return ProfileEvents.fromProfile(eventOptions).items.map(e => e.type);
    };

    describe('Narcotic depth', () => {
        it('trimix does not exceed narcotic depth with open circuit', () => {
            expect(eventTypes(new Gas(0.18, 0.45), 50)).not.toContain(EventType.maxEndExceeded);
        });

        it('air exceeds narcotic depth with open circuit', () => {
            expect(eventTypes(StandardGases.air, 50)).toContain(EventType.maxEndExceeded);
        });
    });

    describe('Density', () => {
        it('air exceeds density with open circuit', () => {
            expect(eventTypes(StandardGases.air, 5.7)).toContain(EventType.highGasDensity);
        });
    });
});
