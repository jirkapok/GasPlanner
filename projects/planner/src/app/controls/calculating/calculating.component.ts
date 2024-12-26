import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-calculating',
    templateUrl: './calculating.component.html',
    styleUrls: ['./calculating.component.scss']
})
export class CalculatingComponent {
    @Input() public show = false;
}
