import { EventType, Event, StandardGases } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { IgnoredIssuesService } from './IgnoredIssues.service';
import { UnitConversion } from './UnitConversion';

describe('IgnoredIssuesService', () => {
    let appSettings: ApplicationSettingsService;
    let sut: IgnoredIssuesService;
    const switchToHigherN2Event = Event.create(EventType.switchToHigherN2, 0, 0, StandardGases.air);
    const highGasDensityEvent = Event.create(EventType.highGasDensity, 0, 0, StandardGases.air);
    const noDecoEndEvent =Event.create(EventType.noDecoEnd, 0, 0, StandardGases.air);
    const highAscentSpeedEvent = Event.create(EventType.highAscentSpeed, 0, 0, StandardGases.air);
    const testEvents: Event[] = [switchToHigherN2Event, highGasDensityEvent, noDecoEndEvent, highAscentSpeedEvent];

    beforeEach(() => {
        const unitConversion = new UnitConversion();
        appSettings = new ApplicationSettingsService(unitConversion);
        sut = new IgnoredIssuesService(appSettings);
    });

    it('should filter out switchToHigherN2 when icdIgnored is true', () => {
        appSettings.icdIgnored = true;
        const filteredResult = sut.filterIgnored(testEvents);

        expect(filteredResult).toEqual([highGasDensityEvent, noDecoEndEvent, highAscentSpeedEvent]);
    });

    it('should filter out highGasDensity when densityIgnored is true', () => {
        appSettings.densityIgnored = true;
        const filteredResult = sut.filterIgnored(testEvents);

        expect(filteredResult).toEqual([switchToHigherN2Event, noDecoEndEvent, highAscentSpeedEvent]);
    });

    it('should filter out noDecoEnd when noDecoIgnored is true', () => {
        appSettings.noDecoIgnored = true;
        const filteredResult = sut.filterIgnored(testEvents);

        expect(filteredResult).toEqual([ switchToHigherN2Event, highGasDensityEvent, highAscentSpeedEvent]);
    });

    it('should not filter out any issues when every issues are off', () => {
        const filteredResult = sut.filterIgnored(testEvents);
        expect(filteredResult).toEqual(testEvents);
    });
});
