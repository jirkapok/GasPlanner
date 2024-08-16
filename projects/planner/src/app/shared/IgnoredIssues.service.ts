import { EventType } from 'scuba-physics';
import { Injectable } from '@angular/core';

@Injectable()
export class IgnoredIssuesService {
    public icdIgnored = false;
    public densityIgnored = false;
    public noDecoIgnored = false;

    public get ignoredIssues(): EventType[] {
        const ignored: EventType[] = [];

        if (this.icdIgnored) {
            ignored.push(EventType.switchToHigherN2);
        }

        if (this.densityIgnored) {
            ignored.push(EventType.highGasDensity);
        }

        if (this.noDecoIgnored) {
            ignored.push(EventType.noDecoEnd);
        }

        return ignored;
    }
}
