import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-calculating',
    templateUrl: './calculating.component.html',
    styleUrls: ['./calculating.component.scss'],
    imports: [
        NgIf
    ],
})
export class CalculatingComponent {
    @Input() public show = false;
}
