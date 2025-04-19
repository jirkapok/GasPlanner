import { Component,Input } from '@angular/core';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { HelpModalComponent } from '../help/help-modal.component';
import { FeatureFlags } from 'scuba-physics';
import { faCircleInfo, faShareFromSquare, faThumbsUp, faFilter, faFire, faSackDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-card-header',
    templateUrl: './card-header.component.html',
    styleUrl: './card-header.component.scss'
})

export class CardHeaderComponent {

    @Input() public title = 'Untitled';
    @Input() public showShare = false;
    @Input() public showFilter = false;
    @Input() public showHeatMap = false;
    @Input() public showTogglePricing = false;
    @Input() public showEmergencyAscent = false;
    @Input() public helpName = 'not-implemented';
    @Input() public headerIcon = faCircleInfo;

    public readonly helpIcon = faCircleInfo;
    public readonly iconShare = faShareFromSquare;
    public readonly filterIcon = faFilter;
    public readonly emergencyIcon = faThumbsUp;
    public readonly heatmapIcon = faFire;
    public readonly dollarIcon = faSackDollar;
    public integratedHelp = FeatureFlags.Instance.integratedHelp;

    private modalRef: MdbModalRef<HelpModalComponent> | null = null;

    constructor(private modalService: MdbModalService) {}

    @Input() public onSwitchHeatMap: () => void = () => {
        console.log('Default switchHeatMap clicked!');
    };

    @Input() public onSwitchEmergencyAscent: () => void = () => {
        console.log('Default switchEmergencyAscent clicked!');
    };

    @Input() public onSwitchFilter: () => void = () => {
        console.log('Default switchFilter clicked!');
    };

    @Input() public onSharePlan: () => void = () => {
        console.log('Default sharePlan clicked!');
    };

    @Input() public onTogglePricing: () => void = () => {
        console.log('Default togglePricing clicked!');
    };

    public openHelp(): void {
        this.modalRef = this.modalService.open(HelpModalComponent, {
            data: {
                path: this.helpName
            }
        });
    }
}
