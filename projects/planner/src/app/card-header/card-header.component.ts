import { Component,Input } from '@angular/core';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';
import { HelpService } from "../shared/learn/help.service";

@Component({
    selector: 'app-card-header',
    templateUrl: './card-header.component.html',
    styleUrl: './card-header.component.scss',
    standalone: false
})

export class CardHeaderComponent {
    @Input() public cardTitle = '';
    @Input() public helpDocument = Urls.notAvailable;
    @Input() public headerIcon = faCircleInfo;
    public readonly helpIcon = faCircleInfo;

    constructor(private help: HelpService) {}

    public openHelp(): void {
        this.help.openHelp(this.helpDocument);
    }
}
