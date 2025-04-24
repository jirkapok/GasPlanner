import { Injectable } from "@angular/core";
import { Urls } from "./navigation.service";
import { NgxMdService } from "ngx-md";

@Injectable()
export class MarkdownCustomization {
    constructor(private urls: Urls, private markdown: NgxMdService) {}
    public configure(): void {
        this.markdown.renderer.image = (href: string, _: string, text: string) => {
            const resolvedUrl = this.urls.imageUrl(href);
            return `<img src="${resolvedUrl}" alt="${text}" class="img-fluid p-3" title="${text}">`;
        };

        this.markdown.renderer.link = (href: string, _: string, text: string) => {
            console.log('Original href:', href);
            if (href && href.startsWith('./') && href.endsWith('.md')) {
                const sanitizedHref = href.replace('./', '').replace('.md', '');
                console.log('sanitizedHref', sanitizedHref);
                return `<a href="/help/${sanitizedHref}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };
    }
}
