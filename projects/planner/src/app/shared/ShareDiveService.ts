import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { Streamed } from './streamed';
import { QrCodeModalComponent } from '../qr-code-modal/qr-code-modal.component';

@Injectable()
export class ShareDiveService extends Streamed {
    public toastVisible = false;

    constructor(
        private clipboard: ClipboardService,
        private modalService: MdbModalService
    ) {
        super();

        this.clipboard.copyResponse$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.copyToClipBoard(res);
            });
    }

    public async sharePlan(): Promise<void> {
        const url = window.location.href;
        const shareData: ShareData = { url };

        if (!this.canUseShareApi(shareData)) {
            this.clipboard.copy(url);
            return;
        }

        // Some browsers get stuck on navigator.share() and never resolve
        // the Promise, causing an InvalidStateError on the next call
        try {
            await navigator.share(shareData);
        } catch (error) {
            const name = (error as DOMException)?.name;

            if (name === 'InvalidStateError') {
                this.clipboard.copy(url);
            }
        }
    }

    public hideToast(): void {
        this.toastVisible = false;
    }

    public sharePlanQrCode(): void {
        this.modalService.open(QrCodeModalComponent);
    }

    private copyToClipBoard(res: IClipboardResponse) {
        // stupid replacement of Bootstrap toasts, because not part of the free mdb package
        if (res.isSuccess) {
            this.toastVisible = true;
            setTimeout(() => {
                this.hideToast();
            }, 5000);
        }
    }

    private canUseShareApi(shareData: ShareData): boolean {
        return typeof navigator.share === 'function' &&
                (typeof navigator.canShare !== 'function' || navigator.canShare(shareData));
    }
}
