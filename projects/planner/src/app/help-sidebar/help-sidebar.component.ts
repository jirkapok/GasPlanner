import { AfterViewInit, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MarkdownComponent } from 'ngx-markdown';
import { HelpService } from '../shared/learn/help.service';

@Component({
    selector: 'app-help-sidebar',
    imports: [MarkdownComponent, TranslatePipe],
    templateUrl: './help-sidebar.component.html',
    styleUrl: './help-sidebar.component.scss',
    host: {
        // Fixes issue, where a <pre> tag would stretch
        // the entire markdown document off-screen
        'style': 'width: 100%;',
    },
})
export class HelpSidebarComponent implements AfterViewInit {
    @ViewChild('helpSidebar')
    private sidebarPanel!: ElementRef<HTMLElement>;
    protected document = this.helpService.document;
    protected isInitialized = signal(false);

    constructor(private helpService: HelpService) {
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
