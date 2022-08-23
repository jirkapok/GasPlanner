import { Component } from '@angular/core';
import pkg from '../../../../../package.json';

@Component({
    selector: 'app-info',
    templateUrl: './appinfo.component.html',
    styleUrls: ['./appinfo.component.css']
})
export class AppinfoComponent {
    public appVersion: string = pkg.version;
}
