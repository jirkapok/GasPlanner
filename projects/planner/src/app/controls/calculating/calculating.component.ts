import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-calculating',
    templateUrl: './calculating.component.html',
    styleUrls: ['./calculating.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslatePipe],
})
export class CalculatingComponent {
    @Input() public show = false;
}
