import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';
import { HelpService } from '../shared/learn/help.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-card-header',
    templateUrl: './card-header.component.html',
    styleUrl: './card-header.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        FaIconComponent, TranslatePipe
    ]
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
