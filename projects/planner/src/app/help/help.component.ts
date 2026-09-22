import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import _ from 'lodash';
import { NgxMdModule  } from 'ngx-md';
import { NgClass, Location } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Urls } from '../shared/navigation.service';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MarkdownCustomization } from '../shared/markdown-customization.service';
import { HelpViewState } from '../shared/views.model';
import { KnownViews } from '../shared/viewStates';
import { SubViewStorage } from '../shared/subViewStorage';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-help',
    imports: [NgxMdModule, FontAwesomeModule, NgClass, TranslatePipe],
    providers: [MarkdownCustomization],
    templateUrl: './help.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
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
            title: 'help.menu.application.title',
            items: [
                { label: 'help.menu.application.usage', path: HelpComponent.defaultDocument },
                { label: 'help.menu.application.settings', path: 'settings' }
            ]
        },
        {
            id: 'plan',
            title: 'help.menu.plan.title',
            items: [
                { label: 'help.menu.plan.tanks', path: 'tanks' },
                { label: 'help.menu.plan.standardGases', path: 'standard_gases' },
                { label: 'help.menu.plan.depths', path: 'depths' },
                { label: 'help.menu.plan.surfaceInterval', path: 'depths', anchor: 'repetitive-dives-and-surface-interval' }
            ]
        },
        {
            id: 'options',
            title: 'help.menu.options.title',
            items: [
                { label: 'help.menu.options.general', path: 'plan_options' },
                { label: 'help.menu.options.environment', path: 'environment' },
                { label: 'help.menu.options.conservatism', path: 'gradient_factors' },
                { label: 'help.menu.options.gases', path: 'plan_options', anchor: 'gases' },
                { label: 'help.menu.options.airBreaks', path: 'plan_options', anchor: 'air-breaks' },
                { label: 'help.menu.options.stops', path: 'stops' },
                { label: 'help.menu.options.speeds', path: 'speeds' },
                { label: 'help.menu.options.diver', path: 'plan_options', anchor: 'diver' }
            ]
        },
        {
            id: 'results',
            title: 'help.menu.results.title',
            items: [
                { label: 'help.menu.results.diveInfoTable', path: 'diveinfo' },
                { label: 'help.menu.results.oxygenToxicity', path: 'diveinfo', anchor: 'oxygen-toxicity' },
                { label: 'help.menu.results.events', path: 'events' },
                { label: 'help.menu.results.consumedGasCharts', path: 'consumed' },
                { label: 'help.menu.results.wayPointsTable', path: 'waypoints_table' },
                { label: 'help.menu.results.profileChart', path: 'profile_chart' },
                { label: 'help.menu.results.tissuesHeatMap', path: 'profile_chart', anchor: 'tissues-heat-map' }
            ]
        },
        {
            id: 'calculators',
            title: 'help.menu.calculators.title',
            items: [
                { label: 'help.menu.calculators.sac', path: 'sac' },
                { label: 'help.menu.calculators.nitrox', path: 'nitrox' },
                { label: 'help.menu.calculators.ndl', path: 'ndl_limits' },
                { label: 'help.menu.calculators.altitude', path: 'altitude' },
                { label: 'help.menu.calculators.weight', path: 'weight' },
                { label: 'help.menu.calculators.gasProperties', path: 'gas_properties' },
                { label: 'help.menu.calculators.redundancies', path: 'redundancies' },
                { label: 'help.menu.calculators.gasBlender', path: 'gas_blender' }
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
        };
    }
}
