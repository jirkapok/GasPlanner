import { Component, Input, OnInit } from '@angular/core';
import _ from 'lodash';
import { NgxMdModule  } from 'ngx-md';
import { NgForOf, NgClass, Location } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MarkdownCustomization } from '../shared/markdown-customization.service';
import { HelpViewState } from "../shared/views.model";
import { KnownViews } from "../shared/viewStates";
import { SubViewStorage } from "../shared/subViewStorage";

@Component({
    selector: 'app-help',
    imports: [NgxMdModule, FontAwesomeModule, NgForOf, NgClass],
    providers: [MarkdownCustomization],
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {
    private static defaultDocument = 'application';
    public headerIcon = faCircleInfo;
    private activeSection = HelpComponent.defaultDocument;
    private _document = HelpComponent.defaultDocument;
    private _anchor?: string = '';

    public sections: any[] = [
        {
            id: HelpComponent.defaultDocument,
            title: 'Application',
            items: [
                { label: 'Application usage', path: HelpComponent.defaultDocument },
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
                { label: 'General', path: 'plan_options' },
                { label: 'Environment', path: 'environment' },
                { label: 'Conservatism', path: 'gradient_factors' },
                { label: 'Gases', path: 'plan_options', anchor: 'gases' },
                { label: 'Air breaks', path: 'plan_options', anchor: 'air-breaks' },
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

    constructor(
        public urls: Urls,
        private location: Location,
        private viewStates: SubViewStorage,
        markdown: MarkdownCustomization) {
        markdown.configure();
    }

    public get document(): string {
        return this._document;
    }

    public get anchor(): string | undefined {
        return this._anchor;
    }

    public get path(): string {
        return this.urls.helpMarkdownUrl(this.document);
    }

    @Input()
    public set document(value: string) {
        this._document = value || HelpComponent.defaultDocument;
    }

    @Input()
    public set anchor(value: string | undefined) {
        this._anchor = value;
    }

    public ngOnInit(): void {
        if(this.document === HelpComponent.defaultDocument && !this.anchor) {
            this.loadState();
        }
    }

    public updatePath(item: { path: string, anchor?: string }): void {
        this.document = item.path;
        this.anchor = item.anchor;
        this.scrollToAnchor();
        this.saveState();
    }

    public toggleSection(id: string): void {
        this.activeSection = this.activeSection === id ? '' : id;
    }

    public scrollToAnchor(): void {
        const section = _(this.sections).find(s => _(s.items).find(i => i.path === this.document && i.anchor === this.anchor));
        this.activeSection = section ? section.id : HelpComponent.defaultDocument;
        const location = this.urls.helpUrl(this.document, this.anchor);
        this.location.go(location);

        if (this.anchor) {
            const el = document.getElementById(this.anchor);
            el?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    public isActiveDocument(item: {path: string, anchor: string }): boolean {
        return this.document === item.path && (this.anchor || '') === (item.anchor || '');
    }

    public isActiveSection(section: { id: string }): boolean {
        return this.activeSection === section.id;
    }

    private loadState(): void {
        let state: HelpViewState = this.viewStates.loadView(
            KnownViews.help
        );

        if (!state) {
            state = this.createState();
        }

        this.updatePath({
            path: state.document,
            anchor: state.anchor
        });
    }

    private saveState(): void {
        const state = this.createState();
        this.viewStates.saveView<HelpViewState>(state);
    }

    private createState(): HelpViewState {
        return {
            id:  KnownViews.help,
            document: this.document,
            anchor: this.anchor
        }
    }
}
