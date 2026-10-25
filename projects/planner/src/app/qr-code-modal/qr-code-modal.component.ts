import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-qr-code-modal',
    templateUrl: './qr-code-modal.component.html',
    // changeDetection: ChangeDetectionStrategy.Eager,  TODO: Remove if not needed
    styleUrls: ['./qr-code-modal.component.scss'],
    imports: [TranslatePipe],
})
export class QrCodeModalComponent {
}
