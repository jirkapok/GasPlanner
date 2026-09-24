import { Component, ChangeDetectionStrategy } from '@angular/core';
import pkg from '../../../../../package.json';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-info',
    templateUrl: './appinfo.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./appinfo.component.scss'],
    imports: [TranslatePipe],
})
export class AppinfoComponent {
    public appVersion: string = pkg.version;
}
