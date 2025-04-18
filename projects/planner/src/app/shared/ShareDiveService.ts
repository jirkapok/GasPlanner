import { Injectable } from "@angular/core";
import { ClipboardService, IClipboardResponse } from "ngx-clipboard";
import { Streamed } from "./streamed";

@Injectable()
export class ShareDiveService extends Streamed {
    public toastVisible = false;

    constructor(private clipboard: ClipboardService) {
        super();

        this.clipboard.copyResponse$.subscribe((res) => {
            this.copyToClipBoard(res);
        });
    }

    public sharePlan(): void {
        this.clipboard.copy(window.location.href);
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
