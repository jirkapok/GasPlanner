import { Injectable } from '@angular/core';
import { HelpModalComponent } from '../../help-modal/help-modal.component';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';

@Injectable({
    providedIn: 'root'
})
export class HelpService {
    private modalRef: MdbModalRef<HelpModalComponent> | null = null;

    // TODO add support for scrolling to open/close the help using gestures side panel
    //  https://hammerjs.github.io/tips/
    constructor(private modalService: MdbModalService) {
    }

    public openQuizHelp(): void {
        this.openHelp('quiz-help');
    }

    public openLearnWelcome(): void {
        this.openHelp('learn-welcome');
    }

    public openHelp(helpDocument: string): void {
        this.modalRef = this.modalService.open(HelpModalComponent, {
            data: {
                path: helpDocument
            }
        });
    }
}
