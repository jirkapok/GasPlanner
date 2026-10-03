import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Urls } from '../navigation.service';
import { HelpModalComponent } from '../../help-modal/help-modal.component';

@Injectable({
    providedIn: 'root'
})
export class HelpService {
    private _document = this.urls.helpMarkdownUrl(Urls.notAvailable);
    private overlayRef: OverlayRef | null = null;

    constructor(
        private urls: Urls,
        private overlay: Overlay
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
       const positionStrategy = this.overlay
            .position()
            .global()
            .top('0')
            .right('0');

        this.overlayRef = this.overlay.create({
            positionStrategy,

            width: 'min(100vw, 475px)',
            height: '100vh',

            hasBackdrop: false,
            scrollStrategy: this.overlay.scrollStrategies.noop(),

            disposeOnNavigation: true,
        })
    }

    private attachSidebarToOverlay(): void {
        this.overlayRef?.attach(
            new ComponentPortal(HelpModalComponent)
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

        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.overlayRef = null;
    }
}
