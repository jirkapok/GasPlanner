import { Component,Input } from '@angular/core';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { FeatureFlags } from 'scuba-physics';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';

@Component({
    selector: 'app-card-header',
    templateUrl: './card-header.component.html',
    styleUrl: './card-header.component.scss'
})

export class CardHeaderComponent {

    @Input() public cardTitle = 'Untitled';
    @Input() public helpName = Urls.notAvailable;
    @Input() public headerIcon = faCircleInfo;

    public readonly helpIcon = faCircleInfo;

    private modalRef: MdbModalRef<HelpModalComponent> | null = null;

    constructor(private modalService: MdbModalService) {}

    public openHelp(): void {
        console.log(`Help for: ${this.helpName}`);
        this.modalRef = this.modalService.open(HelpModalComponent, {
            data: {
                path: this.helpName
            }
        });
    }
}
