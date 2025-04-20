import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { NgxMdModule } from 'ngx-md';
import { Urls } from '../shared/navigation.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-help-modal',
    standalone: true,
    imports: [ NgxMdModule, HttpClientModule ],
    templateUrl: './help-modal.component.html',
    styleUrl: './help-modal.component.scss'
})

export class HelpModalComponent {
    private _path = this.urls.infoUrl(Urls.notAvailable);

    constructor(
        public modalRef: MdbModalRef<HelpModalComponent>,
        private http: HttpClient,
        public urls: Urls,
    ) {}

    get path() {
        return this._path;
    }

    @Input()
    set path(value: string) {
        const filePath = this.urls.infoUrl(value);

        this.http.head(filePath, { observe: 'response' })
            .pipe(
                catchError(() => of(null)) // Suppress error
            )
            .subscribe(response => {
                if (response && response.status === 200) {
                    this._path = filePath; // Only set if the file exists
                }
                // Else: silently do nothing
            });
    }
}
