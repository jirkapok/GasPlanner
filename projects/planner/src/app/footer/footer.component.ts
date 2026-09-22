import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AppinfoComponent } from '../appinfo/appinfo.component';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ AppinfoComponent ]
})
export class AppFooterComponent {
}
