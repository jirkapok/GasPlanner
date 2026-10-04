import { AfterViewInit, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMdModule } from 'ngx-md';
import { MarkdownCustomization } from '../shared/markdown-customization.service';
import { HelpService } from '../shared/learn/help.service';

@Component({
    selector: 'app-help-sidebar',
    imports: [NgxMdModule, TranslatePipe],
    providers: [MarkdownCustomization],
    templateUrl: './help-sidebar.component.html',
    styleUrl: './help-sidebar.component.scss'
})
export class HelpSidebarComponent implements AfterViewInit {
    @ViewChild('helpSidebar')
    private sidebarPanel!: ElementRef<HTMLElement>;
    protected document = this.helpService.document;
    protected isInitialized = signal(false);

    constructor(
        private markdown: MarkdownCustomization,
        private helpService: HelpService
    ) {
        this.markdown.configure();
    }

    ngAfterViewInit(): void {
        this.isInitialized.set(true);
        requestAnimationFrame(() => {
            this.animateIn();
            this.getFocus();
        });
    }

    protected close(): void {
        this.helpService.closeHelp();
    }

    private getFocus(): void {
        this.sidebarPanel.nativeElement.focus();
    }

    private animateIn(): void {
        this.sidebarPanel.nativeElement.animate(
            [
                { transform: 'translateX(100%)' },
                { transform: 'translateX(0)' },
            ],
            {
                duration: 300,
                easing: 'ease-in',
                fill: 'both',
            }
        );
    }
}
