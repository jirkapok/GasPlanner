import { EventOptions, ProfileEvents } from './ProfileEvents';
import { EventType } from './CalculatedProfile';
import { OptionExtensions } from './Options.spec';
import { Segments } from '../depths/Segments';
import { Gas } from '../gases/Gases';
import { DensityAtDepth } from '../gases/GasDensity';
import { DepthConverter, DepthConverterFactory } from '../physics/depth-converter';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';

describe('Profile events - Breathing model', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
    options.maxEND = 30;
    const openCircuit = new OpenCircuitBreathing(new DepthConverterFactory(options).create());

    const eventTypes = (gas: Gas, maxDensity: number, breathing?: BreathingModel): EventType[] => {
        const segments = new Segments();
        segments.add(60, gas, Time.oneMinute * 3);
        segments.addFlat(gas, Time.oneMinute * 10);
        const eventOptions: EventOptions = {
            maxDensity: maxDensity,
            startAscentIndex: 2,
            profile: segments.items,
            ceilings: [],
            profileOptions: options,
            breathing: breathing
        };
        return ProfileEvents.fromProfile(eventOptions).items.map(e => e.type);
    };

    describe('Narcotic depth', () => {
        it('trimix does not exceed narcotic depth with explicit open circuit', () => {
            expect(eventTypes(new Gas(0.18, 0.45), 50, openCircuit)).not.toContain(EventType.maxEndExceeded);
        });

        it('air exceeds narcotic depth with explicit open circuit', () => {
            expect(eventTypes(StandardGases.air, 50, openCircuit)).toContain(EventType.maxEndExceeded);
        });

        it('explicit open circuit generates the same events as without model', () => {
            expect(eventTypes(StandardGases.air, 50, openCircuit)).toEqual(eventTypes(StandardGases.air, 50));
        });
    });

    describe('Density', () => {
        it('explicit open circuit generates the same density events as without model', () => {
            const withModel = eventTypes(StandardGases.air, 5.7, openCircuit);
            expect(withModel).toContain(EventType.highGasDensity);
            expect(withModel).toEqual(eventTypes(StandardGases.air, 5.7));
        });

        it('highest density with explicit open circuit equals density without model', () => {
            const depthConverter = DepthConverter.simple();
            const profile = new Segments();
            profile.add(30, StandardGases.ean32, Time.oneMinute * 2);

            const withModel = new DensityAtDepth(depthConverter, new OpenCircuitBreathing(depthConverter)).forProfile(profile.items);
            const withoutModel = new DensityAtDepth(depthConverter).forProfile(profile.items);
            expect(withModel.density).toBeCloseTo(withoutModel.density, 10);
            expect(withModel.depth).toBe(withoutModel.depth);
        });
    });
});
