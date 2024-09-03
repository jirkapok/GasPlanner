import { EventType, Event, StandardGases } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { IgnoredIssuesService } from './IgnoredIssues.service';

describe('IgnoredIssuesService', () => {
    let appSettings: ApplicationSettingsService;
    let service: IgnoredIssuesService;

    const testEvents: Event[] = [
        Event.create(EventType.switchToHigherN2, 0, 0, StandardGases.air),
        Event.create(EventType.highGasDensity, 0, 0, StandardGases.air),
        Event.create(EventType.noDecoEnd, 0, 0, StandardGases.air)
    ];

    beforeEach(() => {
        appSettings = new ApplicationSettingsService();
        service = new IgnoredIssuesService(appSettings);
    });

    it('should filter out ignored issues', () => {
        appSettings.icdIgnored = true;
        appSettings.densityIgnored = true;
        appSettings.noDecoIgnored = true;

        const filteredEvents = service.filterIgnored(testEvents);

        expect(filteredEvents).toEqual([
            Event.create(EventType.switchToHigherN2, 0, 0, StandardGases.air),
            Event.create(EventType.highGasDensity, 0, 0, StandardGases.air),
            Event.create(EventType.noDecoEnd, 0, 0, StandardGases.air)
        ]);
    });

    it('should include all events when all ignored events are set to false', () => {
        appSettings.icdIgnored = false;
        appSettings.densityIgnored = false;
        appSettings.noDecoIgnored = false;

        const filteredEvents = service.filterIgnored(testEvents);

        expect(filteredEvents).toEqual(testEvents);
    });
});
