import { Component, ChangeDetectionStrategy } from '@angular/core';
import { faChartArea, faSlidersH, faTasks } from '@fortawesome/free-solid-svg-icons';
import { CardHeaderComponent } from '../card-header/card-header.component';

@Component({
    selector: 'app-simulator',
    templateUrl: './simulator.component.html',
    styleUrls: ['./simulator.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CardHeaderComponent],
})
export class SimulatorComponent {
    public readonly computerIcon = faSlidersH;
    public readonly gasIcon = faTasks;
    public readonly profileIcon = faChartArea;
    public readonly playbackIcon = faSlidersH;
    public readonly eventsIcon = faTasks;
}
