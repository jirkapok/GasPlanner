import { EventOptions, ProfileEvents } from './ProfileEvents';
import { Event, EventType } from './CalculatedProfile';
import { OptionExtensions } from './Options.testing';
import { Segments } from '../depths/Segments';
import { Gas } from '../gases/Gases';
import { DepthConverterFactory } from '../physics/depth-converter';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { MccrBreathing } from '../ccr/MccrBreathing';
import { EccrBreathing } from '../ccr/EccrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { Tank } from '../consumption/Tanks';

describe('Profile events - closed circuit loop ppO2', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.salt);
    options.maxEND = 100; // to eliminate narcosis events
    const depthConverter = new DepthConverterFactory(options).create();
    const tanks = [new Tank(12, 200, 21), new Tank(3, 200, 100)];

    const events = (segments: Segments, breathing: BreathingModel, startAscentIndex = 2): Event[] => {
        const eventOptions: EventOptions = {
            maxDensity: 50, // prevent density events
            startAscentIndex: startAscentIndex,
            profile: segments.items,
            ceilings: [],
            profileOptions: options,
            breathing: breathing
        };
        return ProfileEvents.fromProfile(eventOptions).items;
    };

    const outOfRange = (segments: Segments, breathing: BreathingModel, startAscentIndex = 2): Event[] =>
        events(segments, breathing, startAscentIndex).filter(e => e.type === EventType.ppO2OutOfRange);

    const dive = (depth: number, gas: Gas): Segments => {
        const segments = new Segments();
        segments.add(depth, gas, Time.oneMinute * 4);
        segments.addFlat(gas, Time.oneMinute * 10);
        segments.add(0, gas, Time.oneMinute * 10);
        return segments;
    };

    const mccr = (setpoint: number): MccrBreathing => {
        const rebreather = new RebreatherOptions(CircuitType.mccr);
        rebreather.setpoint = setpoint;
        return new MccrBreathing(rebreather, tanks, depthConverter);
    };

    const eccr = (bottomSetpoint: number, decoSetpoint: number): EccrBreathing => {
        const rebreather = new RebreatherOptions(CircuitType.eccr);
        rebreather.bottomSetpoint = bottomSetpoint;
        rebreather.decoSetpoint = decoSetpoint;
        return new EccrBreathing(rebreather, tanks, depthConverter);
    };

    it('setpoint within limits is not reported', () => {
        expect(outOfRange(dive(40, StandardGases.air), mccr(1.3))).toEqual([]);
    });

    it('diluent flush above maximum ppO2 is reported with the loop ppO2', () => {
        // air at 70 m has ppO2 above 1.6, the loop can't hold the lower setpoint
        const found = outOfRange(dive(70, StandardGases.air), mccr(1.3));
        expect(found.length).toBe(1);
        expect(found[0].depth).toBe(70);
        expect(found[0].timeStamp).toBe(Time.oneMinute * 4);
        expect(found[0].value).toBeCloseTo(StandardGases.air.fO2 * depthConverter.toBar(70), 6);
    });

    it('bottom setpoint above maximum ppO2 is reported', () => {
        expect(outOfRange(dive(40, StandardGases.air), eccr(1.5, 1.3)).length).toBe(1);
    });

    it('deco setpoint within maximum deco ppO2 is not reported', () => {
        expect(outOfRange(dive(40, StandardGases.air), eccr(1.1, 1.5))).toEqual([]);
    });

    it('deco setpoint above maximum ppO2 is reported only before the ascent', () => {
        // deco setpoint 1.5 is above max ppO2 1.4, but within max deco ppO2 1.6, the ascent starts after the descent
        expect(outOfRange(dive(40, StandardGases.air), eccr(1.1, 1.5), 1).length).toBe(0);
    });

    it('loop is not reported as high ppO2 of the diluent', () => {
        expect(events(dive(70, StandardGases.air), mccr(1.3)).some(e => e.type === EventType.highPpO2)).toBe(false);
    });

    it('open circuit is never reported as loop ppO2 out of range', () => {
        const openCircuit = new OpenCircuitBreathing(depthConverter);
        const all = events(dive(70, StandardGases.air), openCircuit);
        expect(all.some(e => e.type === EventType.highPpO2)).toBe(true);
        expect(all.some(e => e.type === EventType.ppO2OutOfRange)).toBe(false);
    });
});
