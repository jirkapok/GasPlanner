import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import { Streamed } from './streamed';

@Injectable()
export class ShareDiveService extends Streamed {
    public toastVisible = false;

    constructor(private clipboard: ClipboardService) {
        super();

        this.clipboard.copyResponse$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.copyToClipBoard(res);
            });
    }

    public async sharePlan(): Promise<void> {
        const url = window.location.href;

        // Some browsers get stuck on navigator.share() and never
        // resolve the Promise, causing an error on the next call
        try {
            await navigator.share({ url });
        } catch (error) {
            console.log('navigator.share API not available, using fallback');
            this.clipboard.copy(url);
        }
    }

    public hideToast(): void {
        this.toastVisible = false;
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
}
