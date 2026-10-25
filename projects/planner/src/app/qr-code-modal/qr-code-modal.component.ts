import { Component, Input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
    selector: 'app-qr-code-modal',
    templateUrl: './qr-code-modal.component.html',
    styleUrls: ['./qr-code-modal.component.scss'],
    imports: [QRCodeComponent, TranslatePipe],
})
export class QrCodeModalComponent {
    // 320px on mobile, 440px everywhere else
    protected qrWidth = toSignal(
        this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
            map(({ matches }) => matches ? 320 : 440)
        ),
        { initialValue: 440 }
    );

    constructor(
        public modalRef: MdbModalRef<QrCodeModalComponent>,
        private breakpointObserver: BreakpointObserver
    ) {}

    public get data(): string {
        return window.location.href;
    }

    protected closeModal(): void {
        this.modalRef.close();
    }
}
