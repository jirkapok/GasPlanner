import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-calculating',
    templateUrl: './calculating.component.html',
    styleUrls: ['./calculating.component.css']
})
export class CalculatingComponent {
    @Input() public show = false;
}
