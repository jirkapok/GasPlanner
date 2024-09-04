import { EventType, Event, StandardGases } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { IgnoredIssuesService } from './IgnoredIssues.service';
import { UnitConversion } from './UnitConversion';

describe('IgnoredIssuesService', () => {
    let appSettings: ApplicationSettingsService;
    let service: IgnoredIssuesService;
    let filteredEvents: Event[];

    const testEvents: Event[] = [
        Event.create(EventType.switchToHigherN2, 0, 0, StandardGases.air),
        Event.create(EventType.highGasDensity, 0, 0, StandardGases.air),
        Event.create(EventType.noDecoEnd, 0, 0, StandardGases.air)
    ];

    beforeEach(() => {
        const unitConversion = new UnitConversion();
        appSettings = new ApplicationSettingsService(unitConversion);
        service = new IgnoredIssuesService(appSettings);
        filteredEvents = service.filterIgnored(testEvents);
    });

    it('should filter out switchToHigherN2 when icdIgnored is true', () => {
        appSettings.icdIgnored = true;
        const filteredResult = service.filterIgnored(testEvents);

        expect(filteredResult).toEqual([
        ]);
    });

    it('should filter out highGasDensity when densityIgnored is true', () => {
        appSettings.densityIgnored = true;
        const filteredResult = service.filterIgnored(testEvents);

        expect(filteredResult).toEqual([]);
    });

    it('should filter out noDecoEnd when noDecoIgnored is true', () => {
        appSettings.noDecoIgnored = true;
        const filteredResult = service.filterIgnored(testEvents);

        expect(filteredResult).toEqual([]);
    });

    it('should not filter out any issues when icdIgnored is off', () => {
        appSettings.icdIgnored = false;

        expect(filteredEvents).toEqual(testEvents);
    });

    it('should not filter out any issues when densityIgnored is off', () => {
        appSettings.densityIgnored = false;

        expect(filteredEvents).toEqual(testEvents);
    });

    it('should not filter out any issues when noDecoIgnored is off', () => {

        appSettings.noDecoIgnored = false;

        expect(filteredEvents).toEqual(testEvents);
    });
});
