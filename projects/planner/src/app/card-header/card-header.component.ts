import { Component,Input } from '@angular/core';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help-modal/help-modal.component';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import { Urls } from '../shared/navigation.service';

@Component({
    selector: 'app-card-header',
    templateUrl: './card-header.component.html',
    styleUrl: './card-header.component.scss'
})

export class CardHeaderComponent {
    @Input() public cardTitle = '';
    @Input() public helpName = Urls.notAvailable;
    @Input() public headerIcon = faCircleInfo;

    public readonly helpIcon = faCircleInfo;

    private modalRef: MdbModalRef<HelpModalComponent> | null = null;

    constructor(private modalService: MdbModalService) {}

    public openHelp(): void {
        this.modalRef = this.modalService.open(HelpModalComponent, {
            data: {
                path: this.helpName
            }
        });
    }
}
