import { Component } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';
import { AppinfoComponent } from '../appinfo/appinfo.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    imports: [AppinfoComponent, FaIconComponent]
})
export class AboutComponent {
    public exclamation = faExclamationTriangle;

    constructor(public urls: Urls) {}
}
