import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';

@Component({
    selector: 'app-rest-interval',
    templateUrl: './rest-interval.component.html',
    styleUrls: ['./rest-interval.component.scss'],
    imports: [
        MdbDropdownModule,
        TranslatePipe
    ]
})
export class RestIntervalComponent {

}
