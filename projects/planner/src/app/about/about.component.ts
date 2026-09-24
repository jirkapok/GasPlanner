import { Component, ChangeDetectionStrategy } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';
import { AppinfoComponent } from '../appinfo/appinfo.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AppinfoComponent, FaIconComponent, TranslatePipe],
})
export class AboutComponent {
    public exclamation = faExclamationTriangle;

    constructor(public urls: Urls) {}
}
