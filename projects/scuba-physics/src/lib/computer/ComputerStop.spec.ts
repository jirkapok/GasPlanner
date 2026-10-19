import { Event, EventsFactory } from '../algorithm/CalculatedProfile';
import { StandardGases } from '../gases/StandardGases';
import { ComputerEvent, ComputerEventType } from './ComputerData';
import { ComputerStop } from './ComputerStop';

describe('ComputerStop', () => {
    const stopAt = (runTime: number, duration: number): ComputerStop =>
        new ComputerStop(ComputerEventType.stop, runTime, 6, duration);

    it('Stop ends after its duration', () => {
        expect(stopAt(900, 60).stopEnd).toEqual(960);
    });

    it('Stop ending earlier keeps its start', () => {
        expect(stopAt(990, 300).endAt(1110)).toEqual(new ComputerStop(ComputerEventType.stop, 990, 6, 120));
    });

    it('Stops happening at the same time overlap', () => {
        expect(stopAt(900, 60).overlaps(stopAt(930, 60))).toBeTrue();
        expect(stopAt(930, 60).overlaps(stopAt(900, 60))).toBeTrue();
    });

    it('Stop starting at the end of other stop does not overlap', () => {
        expect(stopAt(900, 60).overlaps(stopAt(960, 60))).toBeFalse();
        expect(stopAt(960, 60).overlaps(stopAt(900, 60))).toBeFalse();
    });

    describe('Algorithm events', () => {
        const eventsOf = (events: Event[]): ComputerEvent[] => ComputerStop.eventsFrom(events);

        it('Copies high ppO2, low ppO2 and broken ceiling', () => {
            const events = eventsOf([
                EventsFactory.createLowPpO2(5, 1),
                EventsFactory.createHighPpO2(60, 10),
                EventsFactory.createBrokenCeiling(100, 10)
            ]);
            expect(events).toEqual([
                { type: ComputerEventType.lowPpO2, runTime: 5, depth: 1 },
                { type: ComputerEventType.highPpO2, runTime: 60, depth: 10 },
                { type: ComputerEventType.brokenCeiling, runTime: 100, depth: 10 }
            ]);
        });

        it('Copies gas switch with gas name', () => {
            const events = eventsOf([EventsFactory.createGasSwitch(70, 10, StandardGases.ean50)]);
            expect(events).toEqual([
                { type: ComputerEventType.gasSwitch, runTime: 70, depth: 10, gasName: 'EAN50' } as ComputerEvent
            ]);
        });

        it('Converts safety stop to stop with 3 minutes duration', () => {
            const events = eventsOf([EventsFactory.createSafetyStopStart(80, 3)]);
            expect(events).toEqual([new ComputerStop(ComputerEventType.safetyStop, 80, 3, 180)]);
        });

        it('Copies high ascent speed', () => {
            const events = eventsOf([EventsFactory.createHighAscentSpeed(120, 20)]);
            expect(events).toEqual([{ type: ComputerEventType.highAscentSpeed, runTime: 120, depth: 20 }]);
        });

        it('Ignores other events', () => {
            const events = eventsOf([
                EventsFactory.createNoDecoEnd(50, 10),
                EventsFactory.createHighDescentSpeed(60, 10)
            ]);
            expect(events).toEqual([]);
        });
    });
});
