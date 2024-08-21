import { EventType } from 'scuba-physics';
import { ApplicationSettingsService } from './ApplicationSettings';
import { IgnoredIssuesService } from './IgnoredIssues.service';
import { UnitConversion } from './UnitConversion';

describe('IgnoredIssuesService', () => {
    let appSettings: ApplicationSettingsService;
    let service: IgnoredIssuesService;
    let unitConversion: UnitConversion;

    beforeEach(() => {
        unitConversion = new UnitConversion();
        appSettings = new ApplicationSettingsService(unitConversion);
        service = new IgnoredIssuesService(appSettings);
    });

    describe('ignoredIssues', () => {
        it('should add switchToHigherN2 to ignoredIssues when icdIgnored is true', () => {
            appSettings.settings.icdIgnored = true;
            const ignoredIssues = service.getIgnoredIssues();

            expect(ignoredIssues).toContain(EventType.switchToHigherN2);
        });
    });
});
