import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { Urls } from '../shared/navigation.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
    selector: 'app-help-modal',
    standalone: true,
    imports: [ NgxMdModule, HttpClientModule],
    providers: [ Urls, NgxMdService ],
    templateUrl: './help-modal.component.html',
    styleUrl: './help-modal.component.scss'
})

export class HelpModalComponent {
    private _path = this.urls.infoUrl(Urls.notAvailable);

    constructor(
        public modalRef: MdbModalRef<HelpModalComponent>,
        private http: HttpClient,
        public urls: Urls,
        private _markdown: NgxMdService
    ) {}

    get path() {
        return this._path;
    }

    @Input()
    set path(value: string) {
        this._path  = this.urls.infoUrl(value);
    }

    onLoad() {
        this._markdown.renderer.image = (href: string, text: string) =>
            `<img src="${this.urls.infoImageUrl(href)}" alt="${text}" class="w-100 p-3" title="${text}">`;
    }
}
