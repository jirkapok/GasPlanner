import { Component, Input, OnInit } from '@angular/core';
import { NgxMdModule, NgxMdService } from 'ngx-md';
import { NgForOf, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [NgxMdModule, FontAwesomeModule, NgForOf, NgIf],
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
    public activeSection = 'plan';
    public selectedPath = 'readme';
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
                { label: 'Surface interval', path: 'depths#repetitive-dives-and-surface-interval' }
            ]
        },
        {
            id: 'options',
            title: 'Options',
            items: [
                { label: 'Environment', path: 'environment' },
                { label: 'Conservatism', path: 'gradient_factors' },
                { label: 'Gases', path: 'plan_options#gases' },
                { label: 'Stops', path: 'stops' },
                { label: 'Speeds', path: 'speeds' },
                { label: 'Diver', path: 'plan_options#diver' }
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
            id: 'settings',
            title: 'Application settings',
            items: [
                { label: 'Application settings', path: 'settings' }
            ]
        }
    ];


    private _label = 'readme';
    constructor(
        public urls: Urls,
        private _markdown: NgxMdService
    ) {
        console.log('HelpComponent', this.label, this.path);
    }

    public get label(): string {
        return this._label;
    }

    @Input()
    public set label(value: string) {
        this._label = value || 'readme';
        this.path = this.urls.infoUrl(this._label);
        this.selectedPath = this._label;
    }

    ngOnInit(): void {
        if (!this.selectedPath) {
            const first = this.sections[0]?.items[0];
            if (first) {
                this.updatePath(first.path);
            }
        }
    }

    updatePath(value: string): void {
        this.selectedPath = value;
        this.path = this.urls.infoUrl(value);
    }

    onLoad() {
        this._markdown.renderer.image = (href: string, title: string, text: string) =>
            `<img src="${this.urls.infoImageUrl(href)}" alt="${text}" class="w-100 p-3" title="${text}">`;

        this._markdown.renderer.link = (href: string, title: string, text: string) => {
            if (href?.startsWith('./') && href?.endsWith('.md')) {
                console.log('Original href:', href);
                const sanitizedHref = href.replace('./', '').replace('.md', '');
                return `<a href="/help/${sanitizedHref}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };
    }

    toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }
}
