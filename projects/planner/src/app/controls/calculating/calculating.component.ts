import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-calculating',
    templateUrl: './calculating.component.html',
    styleUrls: ['./calculating.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [],
})
export class CalculatingComponent {
    @Input() public show = false;
}
