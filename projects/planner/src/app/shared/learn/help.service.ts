import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Urls } from '../navigation.service';
import { HelpSidebarComponent } from '../../help-sidebar/help-sidebar.component';
import { LayoutService } from '../layout.service';

@Injectable({
    providedIn: 'root'
})
export class HelpService {
    private _document = this.urls.helpMarkdownUrl(Urls.notAvailable);
    private overlayRef: OverlayRef | null = null;

    constructor(
        private overlay: Overlay,
        private urls: Urls,
        private layoutService: LayoutService,
    ) {
    }

    public get document(): string {
        return this._document;
    }

    public openQuizHelp(): void {
        this.openHelp('quiz-help');
    }

    public openLearnWelcome(): void {
        this.openHelp('learn-welcome');
    }

    public openHelp(helpDocument: string): void {
        const newDocument = this.urls.helpMarkdownUrl(helpDocument);

        this.closeHelp();
        this._document = newDocument;
        this.createOverlay();
    }

    public closeHelp(): void {
        this.destroyOverlay();
    }

    private createOverlay(): void {
        if (this.overlayRef) {
            return;
        }

        this.createOverlayRef();

        this.attachSidebarToOverlay();

        this.listenForEsc();
        this.listenForDetach();
    }

    private createOverlayRef(): void {
        const topOffset = this.layoutService.mainMenuHeight;

        const positionStrategy = this.overlay
            .position()
            .global()
            .top(`${topOffset}px`)
            .right('0');

        this.overlayRef = this.overlay.create({
            positionStrategy,

            width: 'min(100vw, 475px)',
            height: 'auto',
            maxHeight: `calc(100vh - ${topOffset}px)`,

            hasBackdrop: false,
            scrollStrategy: this.overlay.scrollStrategies.noop(),
            disposeOnNavigation: true,
        })
    }

    private attachSidebarToOverlay(): void {
        this.overlayRef?.attach(
            new ComponentPortal(HelpSidebarComponent)
        );
    }

    private listenForEsc(): void {
        this.overlayRef?.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.closeHelp();
            }
        });
    }

    private listenForDetach(): void {
        this.overlayRef?.detachments().subscribe(() => {
            this.overlayRef = null;
        });
    }

    private destroyOverlay(): void {
        if (!this.overlayRef) {
            return;
        }

        const overlayRef = this.overlayRef;
        this.overlayRef = null;

        overlayRef.detach();
        overlayRef.dispose();
    }
}
