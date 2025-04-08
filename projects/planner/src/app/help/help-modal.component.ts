import { Component } from '@angular/core';
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
    constructor(public modalRef: MdbModalRef<HelpModalComponent>) {}
}
