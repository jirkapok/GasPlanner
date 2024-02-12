import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss']
})
export class DiffTabsButtonComponent {
    @Input({required: true}) index = 0;
}
