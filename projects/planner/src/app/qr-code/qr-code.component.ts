import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html',
    // changeDetection: ChangeDetectionStrategy.Eager,  TODO: Remove if not needed
    styleUrls: ['./qr-code.component.scss'],
    imports: [TranslatePipe],
})
export class QrCodeComponent {
}
