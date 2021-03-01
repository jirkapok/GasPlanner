import { Options } from './BuhlmannAlgorithm';
import { DepthConverter } from './depth-converter';
import { Gas, Gases } from './Gases';
import { EventType, ProfileEvents, CalculatedProfile, Ceiling } from './Profile';
import { Segments } from './Segments';
import { Time } from './Time';

describe('Profile', () => {
  const options = new Options(1,1,1.4, 1.6, 30, true);
  const air: Gas = new Gas(0.21, 0); 
  const ean32: Gas = new Gas(0.32, 0);
  const ean50: Gas = new Gas(0.5, 0);
  const oxygen: Gas = new Gas(1, 0);
  const trimix2135: Gas = new Gas(0.21, 0.35);
  const trimix1070: Gas = new Gas(0.1, 0.7);

  describe('Events', () => {
    it('Adds low ppO2 event when breathing 10/70 at beginning of dive', () => {
      const gases = new Gases();
      gases.addBottomGas(trimix1070);
      const segments = new Segments();
      segments.add(0, 30, trimix1070, 1.5 * Time.oneMinute);

      const profile = CalculatedProfile.fromProfile(segments.mergeFlat(), []);;
      const events = ProfileEvents.createEvents(profile, DepthConverter.forFreshWater(), options);
      expect(events.items[0].type).toBe(EventType.lowPpO2);
    });


    it('Adds high ppO2 event when breathing air at 70m', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      const segments = new Segments();
      segments.add(0, 70, air, 3.5 * Time.oneMinute);

      const profile = CalculatedProfile.fromProfile(segments.mergeFlat(), []);;
      const events = ProfileEvents.createEvents(profile, DepthConverter.forFreshWater(), options);
      expect(events.items[0].type).toBe(EventType.highPpO2);
    });

    it('Adds gas switch event', () => {
      const gases = new Gases();
      gases.addBottomGas(air);
      gases.addDecoGas(ean50);
      const segments = new Segments();
      segments.add(40, 40, air, 1 * Time.oneMinute);
      segments.add(40, 21, air, 1 * Time.oneMinute);
      segments.add(21, 21, ean50, 1 * Time.oneMinute);
      segments.add(21, 6, ean50, 1 * Time.oneMinute);

      const profile = CalculatedProfile.fromProfile(segments.mergeFlat(), []);;
      const events = ProfileEvents.createEvents(profile, DepthConverter.forFreshWater(), options);
      expect(events.items[0].type).toBe(EventType.gasSwitch);
      expect(events.items[0].timeStamp).toBe(120);
      expect(events.items[0].depth).toBe(21);
    });
  });
});
