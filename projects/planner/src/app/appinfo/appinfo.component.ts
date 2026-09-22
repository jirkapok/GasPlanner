import { Component, ChangeDetectionStrategy } from '@angular/core';
import pkg from '../../../../../package.json';

@Component({
    selector: 'app-info',
    templateUrl: './appinfo.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./appinfo.component.scss'],
})
export class AppinfoComponent {
    public appVersion: string = pkg.version;
}
