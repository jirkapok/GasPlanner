import { Component } from '@angular/core';
import { NgxMdModule, NgxMdService  } from 'ngx-md';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [ NgxMdModule, FontAwesomeModule],
    templateUrl: './help-overview.component.html',
    styleUrls: ['./help-overview.component.scss']
})

export class HelpOverviewComponent {
    public path = this.urls.infoUrl('readme');
    public headerIcon = faCircleInfo;

    constructor(public urls: Urls,
        private _markdown: NgxMdService
    ) {}

    updatePath(value: string): void {
        this.path = this.urls.infoUrl(value);
    }

    onLoad() {
        this._markdown.renderer.image = (href: string, title: string,  text: string) =>
            `<img src="${this.urls.infoImageUrl(href)}" alt="${text}" class="w-100 p-3" title="${text}">`;
    }
}
