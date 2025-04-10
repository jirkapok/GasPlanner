import { Component, Input } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { NgxMdModule } from 'ngx-md';

@Component({
    selector: 'app-help-modal',
    standalone: true,
    imports: [ NgxMdModule ],
    templateUrl: './help-modal.component.html',
    styleUrl: './help-modal.component.scss'
})

export class HelpModalComponent {
    private _path = 'not-implemented';

    constructor(public modalRef: MdbModalRef<HelpModalComponent>) {}

    get path() {
        return this._path;
    }

    @Input()
    set path(value) {
        this._path = `assets/docs/${value}.md`;
    }
}
