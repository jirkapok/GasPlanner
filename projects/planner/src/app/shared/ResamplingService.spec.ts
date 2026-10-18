import { TestBed } from '@angular/core/testing';
import { EventsFactory, Segment, StandardGases, Time } from 'scuba-physics';
import { ResamplingService } from './ResamplingService';
import { UnitConversion } from './UnitConversion';
import { BoundEvent } from './models';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

describe('ResamplingService', () => {
    const totalDuration = Time.oneMinute * 100;
    let sut: ResamplingService;
    let units: UnitConversion;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ResamplingService, UnitConversion, provideTestTranslate()]
        });

        sut = TestBed.inject(ResamplingService);
        units = TestBed.inject(UnitConversion);
    });

    const gasSwitchAt = (minutes: number): BoundEvent =>
        new BoundEvent(units, EventsFactory.createGasSwitch(Time.oneMinute * minutes, 6, StandardGases.oxygen));

    describe('Event label positions', () => {
        it('Distant events are all placed above', () => {
            const events = [gasSwitchAt(10), gasSwitchAt(40), gasSwitchAt(70)];

            const resampled = sut.convertEvents(events, totalDuration);

            expect(resampled.textPositions).toEqual(['top center', 'top center', 'top center']);
        });

        it('Close event is placed below previous one', () => {
            const events = [gasSwitchAt(60), gasSwitchAt(62)];

            const resampled = sut.convertEvents(events, totalDuration);

            expect(resampled.textPositions).toEqual(['top center', 'bottom center']);
        });

        it('Sequence of close events alternates positions', () => {
            const events = [gasSwitchAt(60), gasSwitchAt(62), gasSwitchAt(64)];

            const resampled = sut.convertEvents(events, totalDuration);

            expect(resampled.textPositions).toEqual(['top center', 'bottom center', 'top center']);
        });

        it('Distant event after close pair is placed above', () => {
            const events = [gasSwitchAt(60), gasSwitchAt(62), gasSwitchAt(90)];

            const resampled = sut.convertEvents(events, totalDuration);

            expect(resampled.textPositions).toEqual(['top center', 'bottom center', 'top center']);
        });

        it('Events hidden in chart are not counted as neighbours', () => {
            const lowPpO2 = new BoundEvent(units, EventsFactory.createLowPpO2(Time.oneMinute * 61, 6));
            const events = [gasSwitchAt(10), lowPpO2, gasSwitchAt(62)];

            const resampled = sut.convertEvents(events, totalDuration);

            expect(resampled.textPositions).toEqual(['top center', 'top center']);
        });
    });

    describe('Average depth', () => {
        // descent to 10 m in 60 s, then 60 s at 10 m
        const profile = [
            new Segment(0, 10, StandardGases.air, 60),
            new Segment(10, 10, StandardGases.air, 60)
        ];

        it('Empty profile has no average depth', () => {
            const resampled = sut.resampleAverageDepth([]);
            expect(resampled.xValues).toEqual([]);
            expect(resampled.yValues).toEqual([]);
        });

        it('Value for every second of the profile', () => {
            const resampled = sut.resampleAverageDepth(profile);
            expect(resampled.xValues.length).toEqual(121);
            expect(resampled.yValues.length).toEqual(121);
        });

        it('Time weighted average depth from start of the dive', () => {
            const resampled = sut.resampleAverageDepth(profile);
            expect(resampled.yValues[60]).toEqual(5);
            expect(resampled.yValues[120]).toEqual(7.5);
        });

        it('Average depth in imperial units', () => {
            units.imperialUnits = true;
            const resampled = sut.resampleAverageDepth(profile);
            // 7.5 m = 24.6 ft
            expect(resampled.yValues[120]).toBeCloseTo(24.6, 1);
        });
    });
});
