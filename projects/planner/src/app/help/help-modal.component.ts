import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { NgxMdModule } from 'ngx-md';
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
    private _path = 'assets/docs/not-implemented.md';

    constructor(public modalRef: MdbModalRef<HelpModalComponent>, private http: HttpClient) {}

    get path() {
        return this._path;
    }

    @Input()
    set path(value: string) {
        const filePath = `assets/docs/${value}.md`;
        this.http.head(filePath, { observe: 'response' })
            .pipe(
                catchError(() => of(null))
            )
            .subscribe(response => {
                if (response && response.status === 200) {
                    this._path = filePath;
                }
            });
    }
}
