import { Component, ElementRef, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMdModule } from 'ngx-md';
import { MarkdownCustomization } from '../shared/markdown-customization.service';
import { HelpService } from '../shared/learn/help.service';

@Component({
    selector: 'app-help-sidebar',
    imports: [NgxMdModule, TranslatePipe],
    providers: [MarkdownCustomization],
    templateUrl: './help-modal.component.html',
    styleUrl: './help-modal.component.scss'
})

export class HelpModalComponent {
    @ViewChild('helpSidebar')
    private sidebarPanel!: ElementRef<HTMLElement>;

    protected document = this.helpService.document;

    constructor(
        private markdown: MarkdownCustomization,
        private helpService: HelpService
    ) {
        this.markdown.configure();
    }

    // Focus upon creation
    ngAfterViewInit(): void {
        requestAnimationFrame(() => {
            this.sidebarPanel.nativeElement.focus();
        });
    }

    protected close(): void {
        this.helpService.closeHelp();
    }
}
