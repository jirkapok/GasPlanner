import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
    selector: 'app-qr-code-modal',
    templateUrl: './qr-code-modal.component.html',
    styleUrls: ['./qr-code-modal.component.scss'],
    imports: [QRCodeComponent, TranslatePipe],
})
export class QrCodeModalComponent {
    constructor(
        public modalRef: MdbModalRef<QrCodeModalComponent>,
    ) {}

    public get data(): string {
        return window.location.href;
    }

    protected closeModal(): void {
        this.modalRef.close();
    }
}
