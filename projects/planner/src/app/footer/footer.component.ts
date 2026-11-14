import { Component } from '@angular/core';
import { AppinfoComponent } from '../appinfo/appinfo.component';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    imports: [ AppinfoComponent ]
})
export class AppFooterComponent {
}
