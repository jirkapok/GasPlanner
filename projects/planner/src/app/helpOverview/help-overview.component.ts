import { Component, Input } from '@angular/core';
import { NgxMdModule, NgxMdService  } from 'ngx-md';
import { NgForOf, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [ NgxMdModule, FontAwesomeModule, NgForOf, NgIf],
    templateUrl: './help-overview.component.html',
    styleUrls: ['./help-overview.component.scss']
})

export class HelpOverviewComponent {
    @Input() public label = 'readme';
    public activeSection = 'plan';
    public path = this.urls.infoUrl(this.label);
    public headerIcon = faCircleInfo;

    sections = [
        {
            id: 'plan',
            title: 'Plan',
            items: [
                { label: 'Tanks', path: 'tanks' },
                { label: 'Standard gases', path: 'standard_gases' },
                { label: 'Depths', path: 'depths' },
                { label: 'Surface interval', path: 'depths#repetitive-dives-and-surface-interval' },
                {
                    label: 'Options',
                    children: [
                        { label: 'Environment', path: 'environment' },
                        { label: 'Conservatism', path: 'gradient_factors' },
                        { label: 'Gases', path: 'plan_options#gases' },
                        { label: 'Stops', path: 'stops' },
                        { label: 'Speeds', path: 'speeds' },
                        { label: 'Diver', path: 'plan_options#diver' }
                    ]
                }
            ]
        },
        {
            id: 'results',
            title: 'Results',
            items: [
                { label: 'Dive info table', path: 'diveinfo' },
                { label: 'Oxygen toxicity', path: 'diveinfo#oxygen-toxicity' },
                { label: 'Events causing errors and warnings', path: 'events' },
                { label: 'Consumed gas charts', path: 'consumed' },
                { label: 'Dive way points table', path: 'waypoints_table' },
                { label: 'Dive profile chart', path: 'profile_chart' },
                { label: 'Tissues heat map', path: 'profile_chart#tissues-heat-map' }
            ]
        },
        {
            id: 'calculators',
            title: 'Calculators',
            items: [
                { label: 'RMV/SAC', path: 'sac' },
                { label: 'Nitrox', path: 'nitrox' },
                { label: 'No decompression limits (NDL) table', path: 'calculators' },
                { label: 'Altitude', path: 'calculators' },
                { label: 'Weight', path: 'calculators' },
                { label: 'Gas properties', path: 'calculators' },
                { label: 'Redundancies', path: 'calculators' },
                { label: 'Gas blender', path: 'calculators' }
            ]
        },
        {
            id: 'external',
            title: 'External Reading',
            items: [
                { label: 'External reading', path: 'links' }
            ]
        }
    ];


    constructor(public urls: Urls,
        private _markdown: NgxMdService
    ) {
        console.log('HelpOverviewComponent', this.label, this.path);}


    updatePath(value: string): void {
        this.path = this.urls.infoUrl(value);
    }

    onLoad() {
        this._markdown.renderer.image = (href: string, title: string,  text: string) =>
            `<img src="${this.urls.infoImageUrl(href)}" alt="${text}" class="w-100 p-3" title="${text}">`;
    }

    toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }
}
