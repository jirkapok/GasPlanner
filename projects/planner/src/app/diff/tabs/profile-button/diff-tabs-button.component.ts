import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-diff-tabs-button',
    templateUrl: './diff-tabs-button.component.html',
    styleUrls: ['./diff-tabs-button.component.scss']
})
export class DiffTabsButtonComponent {
    @Input({required: true}) index = 0;
    buttonFill = 'btn-outline-primary';
    private enabled = false;

    public clicked() {
        if(this.enabled){
            this.disableProfile();
            return;
        }

        this.enableProfile();
    }

    private enableProfile() {
        this.buttonFill = 'btn-primary';
        this.enabled = true;
    }

    private disableProfile() {
        this.buttonFill = 'btn-outline-primary';
        this.enabled = false;
    }
}
