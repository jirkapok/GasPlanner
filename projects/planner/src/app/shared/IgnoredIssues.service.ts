import { EventType, Event } from 'scuba-physics';
import { Injectable } from '@angular/core';
import { ApplicationSettingsService } from './ApplicationSettings';

@Injectable()
export class IgnoredIssuesService {
    public constructor(private appSettings: ApplicationSettingsService) {
    }

    private get ignoredIssues(): EventType[] {
        const ignored: EventType[] = [];

        if (this.appSettings.icdIgnored) {
            ignored.push(EventType.switchToHigherN2);
        }

        if (this.appSettings.densityIgnored) {
            ignored.push(EventType.highGasDensity);
        }

        if (this.appSettings.noDecoIgnored) {
            ignored.push(EventType.noDecoEnd);
        }

        if (this.appSettings.missingAirBreakIgnored) {
            ignored.push(EventType.missingAirBreak);
        }

        return ignored;
    }

    public filterIgnored(issues: Event[]): Event[] {
        return issues.filter(issue => !this.ignoredIssues.includes(issue.type));
    }
}
