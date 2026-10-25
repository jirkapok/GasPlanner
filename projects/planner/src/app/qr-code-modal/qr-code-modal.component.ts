import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
    selector: 'app-qr-code-modal',
    templateUrl: './qr-code-modal.component.html',
    // changeDetection: ChangeDetectionStrategy.Eager,  TODO: Remove if not needed
    styleUrls: ['./qr-code-modal.component.scss'],
    imports: [QRCodeComponent, TranslatePipe],
})
export class QrCodeModalComponent {
    private _data = window.location.href;

    constructor(
        public modalRef: MdbModalRef<QrCodeModalComponent>
    ) {}

    public get data(): string {
        return this._data;
    }

    @Input()
    public set data(value: string) {
        this._data = value;
    }

    protected closeModal(): void {
        this.modalRef.close();
    }
}
