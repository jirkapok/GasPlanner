import { Component } from '@angular/core';
import { NgxMdModule } from 'ngx-md';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-helpoverview',
    standalone: true,
    imports: [ NgxMdModule, FontAwesomeModule],
    templateUrl: './help-overview.component.html',
    styleUrls: ['./help-overview.component.scss']
})

export class HelpOverviewComponent {
    public path = this.urls.infoUrl('readme');
    public headerIcon = faCircleInfo;

    constructor(public urls: Urls) {}

    updatePath(value: string): void {
        this.path = this.urls.infoUrl(value);
    }
}
