import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooterComponent } from './footer/footer.component';
import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { HelpModalComponent } from './help-modal/help-modal.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [MainMenuComponent, AppFooterComponent, RouterOutlet, HelpModalComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: true
})
export class AppComponent {
    constructor() {
    }
}
