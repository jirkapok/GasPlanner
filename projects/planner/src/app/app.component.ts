import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFooterComponent } from './footer/footer.component';
import { MainMenuComponent } from './mainmenu/mainmenu.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [MainMenuComponent,  AppFooterComponent, RouterOutlet],
    standalone: true
})
export class AppComponent {
    constructor() {
    }
}
