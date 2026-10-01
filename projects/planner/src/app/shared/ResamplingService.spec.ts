import { TestBed } from '@angular/core/testing';
import { EventsFactory, StandardGases, Time } from 'scuba-physics';
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
});
