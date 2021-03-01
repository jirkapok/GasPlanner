import { Options } from './BuhlmannAlgorithm';
import { Gas, Gases, StandardGases } from './Gases';
import { EventType, ProfileEvents } from './Profile';
import { Segments } from './Segments';
import { Time } from './Time';

describe('Profile', () => {
  const options = new Options(1,1,1.4, 1.6, 30, true);
  const trimix2135: Gas = new Gas(0.21, 0.35);

  describe('Events', () => {
    it('Adds low ppO2 event when breathing 10/70 at beginning of dive', () => {
      const gases = new Gases();
      gases.addBottomGas(StandardGases.trimix1070);
      const segments = new Segments();
      segments.add(0, 30, StandardGases.trimix1070, 1.5 * Time.oneMinute);

      const events = ProfileEvents.fromProfile(segments.mergeFlat(), options);
      expect(events.items[0].type).toBe(EventType.lowPpO2);
    });


    it('Adds high ppO2 event when breathing air at 70m is added only once', () => {
      const gases = new Gases();
      gases.addBottomGas(StandardGases.air);
      const segments = new Segments();
      segments.add(0, 70, StandardGases.air, 3.5 * Time.oneMinute);
      segments.add(70, 70, StandardGases.air, 2 * Time.oneMinute);
      segments.add(70, 21, StandardGases.air, 2 * Time.oneMinute);

      const events = ProfileEvents.fromProfile(segments.mergeFlat(), options);
      expect(events.items.length).toBe(1);
      expect(events.items[0].type).toBe(EventType.highPpO2);
    });
    
    it('Use deco ppO2 limit during scent - no high PpO2 event is added', () => {
      const gases = new Gases();
      gases.addBottomGas(StandardGases.air);
      const segments = new Segments();
      segments.add(40, 40, StandardGases.air, 1 * Time.oneMinute);
      segments.add(40, 21, StandardGases.air, 2 * Time.oneMinute);
      segments.add(21, 21, StandardGases.ean50, 2 * Time.oneMinute);

      const events = ProfileEvents.fromProfile(segments.mergeFlat(), options);
      // no highPpO2 is added
      expect(events.items.length).toBe(1);
      expect(events.items[0].type).toBe(EventType.gasSwitch);
    });

    it('Adds gas switch event', () => {
      const gases = new Gases();
      gases.addBottomGas(StandardGases.air);
      gases.addDecoGas(StandardGases.ean50);
      const segments = new Segments();
      segments.add(40, 40, StandardGases.air, 1 * Time.oneMinute);
      segments.add(40, 21, StandardGases.air, 1 * Time.oneMinute);
      segments.add(21, 21, StandardGases.ean50, 1 * Time.oneMinute);
      segments.add(21, 6, StandardGases.ean50, 1 * Time.oneMinute);

      const events = ProfileEvents.fromProfile(segments.mergeFlat(), options);

      expect(events.items[0]).toEqual({
        type: EventType.gasSwitch,
        timeStamp: 120,
        depth: 21,
        data: StandardGases.ean50
      });
    });
  });
});
