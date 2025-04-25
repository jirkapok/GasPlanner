import { Component, Input } from '@angular/core';
import { NgxMdModule  } from 'ngx-md';
import { NgForOf, NgClass } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MarkdownCustomization } from '../shared/markdown-customization.service';

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [ NgxMdModule, FontAwesomeModule, NgForOf, NgClass ],
    providers: [ MarkdownCustomization ],
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent {
    public activeSection = 'plan';
    public path = this.urls.helpUrl(this.document);
    public headerIcon = faCircleInfo;
    private _document = 'readme';
    private _anchor?: string = '';

    public sections: any[] = [
        {
            id: 'settings',
            title: 'Application',
            items: [
                { label: 'Application usage', path: 'readme' },
                { label: 'Application settings', path: 'settings' }
            ]
        },
        {
            id: 'plan',
            title: 'Dive Plan',
            items: [
                { label: 'Tanks', path: 'tanks' },
                { label: 'Standard gases', path: 'standard_gases' },
                { label: 'Depths', path: 'depths' },
                { label: 'Surface interval', path: 'depths', anchor: 'repetitive-dives-and-surface-interval' }
            ]
        },
        {
            id: 'options',
            title: 'Dive Options',
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
            title: 'Dive Results',
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
        }
    ];

    constructor(public urls: Urls, markdown: MarkdownCustomization) {
        markdown.configure();
    }

    public get document(): string {
        return this._document;
    }

    public get anchor(): string | undefined {
        return this._anchor;
    }

    @Input()
    public set document(value: string) {
        this._document = value || 'readme';
        this.path = this.urls.helpUrl(value);
    }

    @Input()
    public set anchor(value: string | undefined) {
        this._anchor = value;
    }

    public updatePath(newPath: string, newAnchor?: string): void {
        this.document = newPath;
        this.anchor = newAnchor;
        this.scrollToAnchor();
    }

    public toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }

    public scrollToAnchor(): void {
        if (this.anchor) {
            const el = document.getElementById(this.anchor);
            el?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    public isActiveSection(itemPath: string, itemAnchor: string): boolean {
        return this.document === itemPath && (this.anchor || '') === (itemAnchor || '');
    }
}
