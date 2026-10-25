import { Injectable } from "@angular/core";
import { MdbModalService } from "mdb-angular-ui-kit/modal";
import { QrCodeModalComponent } from "../qr-code-modal/qr-code-modal.component";

@Injectable({
    providedIn: 'root'
})
export class QrCodeService {
    constructor(
        private modalService: MdbModalService
    ) {}

    public showQrCode(data: string): void {
        this.modalService.open(QrCodeModalComponent, {
            data: { data }
        });
    }
}
