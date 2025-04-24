import { Component, Input } from '@angular/core';
import { NgxMdModule  } from 'ngx-md';
import { NgForOf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MarkdownCustomization } from '../shared/markdown-customization.service';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [ NgxMdModule, FontAwesomeModule, NgForOf ],
    providers: [ MarkdownCustomization ],
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})

export class HelpComponent {
    public activeSection = 'plan';
    public path = this.urls.helpUrl(this.label);
    public headerIcon = faCircleInfo;
    private _label = 'readme';
    private _anchor= '';

    public sections = [
        {
            id: 'plan',
            title: 'Plan',
            items: [
                { label: 'Tanks', path: 'tanks' },
                { label: 'Standard gases', path: 'standard_gases' },
                { label: 'Depths', path: 'depths' },
                { label: 'Surface interval', path: 'depths', anchor: 'repetitive-dives-and-surface-interval' }
            ]
        },
        {
            id: 'options',
            title: 'Options',
            items: [
                { label: 'Environment', path: 'environment' },
                { label: 'Conservatism', path: 'gradient_factors' },
                { label: 'Gases', path: 'plan_options', anchor: 'gases' },
                { label: 'Stops', path: 'stops' },
                { label: 'Speeds', path: 'speeds' },
                { label: 'Diver', path: 'plan_options', anchor: 'diver' }
            ]
        },
        {
            id: 'results',
            title: 'Results',
            items: [
                { label: 'Dive info table', path: 'diveinfo' },
                { label: 'Oxygen toxicity', path: 'diveinfo', anchor: 'oxygen-toxicity' },
                { label: 'Events causing errors and warnings', path: 'events' },
                { label: 'Consumed gas charts', path: 'consumed' },
                { label: 'Dive way points table', path: 'waypoints_table' },
                { label: 'Dive profile chart', path: 'profile_chart' },
                { label: 'Tissues heat map', path: 'profile_chart', anchor: 'tissues-heat-map' }
            ]
        },
        {
            id: 'calculators',
            title: 'Calculators',
            items: [
                { label: 'RMV/SAC', path: 'sac' },
                { label: 'Nitrox', path: 'nitrox' },
                { label: 'No decompression limits (NDL) table', path: 'ndl_limits' },
                { label: 'Altitude', path: 'altitude' },
                { label: 'Weight', path: 'weight' },
                { label: 'Gas properties', path: 'gas_properties' },
                { label: 'Redundancies', path: 'redundancies' },
                { label: 'Gas blender', path: 'gas_blender' }
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

    constructor(public urls: Urls, markdown: MarkdownCustomization) {
        markdown.configure();
    }

    public get label(): string {
        return this._label;
    }

    public get anchor(): string {
        return this._anchor;
    }

    @Input()
    public set label(value: string) {
        this._label = value || 'readme';
        this.updatePath(this._label);
    }

    @Input()
    public set anchor(value: string) {
        this._anchor = value;
    }

    public updatePath(value: string): void {
        this.path = this.urls.helpUrl(value);
    }

    public toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }

    // TODO scroll to anchor
    private scrollToElement(id: string): void {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
    }
}
