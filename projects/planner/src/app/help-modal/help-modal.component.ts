import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { Urls } from '../shared/navigation.service';
import { HttpClient } from '@angular/common/http';
import { MarkdownCustomization } from '../shared/markdown-customization.service';

@Component({
    selector: 'app-help-modal',
    standalone: true,
    imports: [ NgxMdModule ],
    providers: [ Urls, NgxMdService, MarkdownCustomization ],
    templateUrl: './help-modal.component.html',
    styleUrl: './help-modal.component.scss'
})

export class HelpModalComponent {
    private _path = this.urls.helpMarkdownUrl(Urls.notAvailable);

    constructor(
        public modalRef: MdbModalRef<HelpModalComponent>,
        private http: HttpClient,
        public urls: Urls,
        private markdown: MarkdownCustomization
    ) {
        this.markdown.configure();
    }

    public get path(): string {
        return this._path;
    }

    @Input()
    public set path(value: string) {
        this._path  = this.urls.helpMarkdownUrl(value);
    }
}
