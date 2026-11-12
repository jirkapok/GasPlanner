import { Injectable } from '@angular/core';
import { Urls } from './navigation.service';
import { NgxMdService } from 'ngx-md';

// ngx-md runs its own nested marked 4, but its typings resolve the root marked 18 types.
// Describes the marked 4 renderer API used at runtime, removed together with ngx-md.
interface Slugger {
    slug(value: string): string;
}

interface LegacyRenderer {
    image: (href: string, title: string, text: string) => string;
    link: (href: string, title: string, text: string) => string;
    heading: (text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string, slugger: Slugger) => string;
    blockquote: (quote: string) => string;
    table: (header: string, body: string) => string;
    code: (code: string, language: string) => string;
}

@Injectable()
export class MarkdownCustomization {
    constructor(private urls: Urls, private markdown: NgxMdService) {}

    public configure(): void {
        const renderer = this.markdown.renderer as unknown as LegacyRenderer;

        renderer.image = (href: string, _: string, text: string) => {
            const resolvedUrl = this.urls.imageUrl(href);
            return `<img src="${resolvedUrl}" alt="${text}" class="img-fluid p-3" title="${text}">`;
        };

        renderer.link = (href: string, _: string, text: string) => {
            if (href && href.startsWith('./') && href.indexOf('.md') > 0) {
                const sanitizedHref = href.replace('./', '').replace('.md', '');
                const parts = sanitizedHref.split('#');
                const helpUrl = this.urls.helpUrl(parts[0], parts[1]);
                return `<a href="${helpUrl}">${text}</a>`;
            } else if (href && href.startsWith('/learn')) {
                return `<a href="${href}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };

        // add id to be able scroll to the anchor
        renderer.heading = (text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string, slugger: Slugger) =>
            `<h${level} id="${slugger.slug(raw)}">${text}</h${level}>`;

        renderer.blockquote = (quote: string) =>
            `<blockquote class="blockquote border-5 border-info border-start p-2 my-2">${quote}</blockquote>`;

        renderer.table = (header: string, body: string) => `<table class="table table-bordered table-sm">
                        <thead class="table-light">${header}</thead>
                        ${body}
                    </table>`;

        renderer.code = (code: string, language: string) => {
            const lang = language ? language : 'plaintext';
            return `<pre class="bg-light p-2 overflow-auto"><code class="language-${lang}">${code}</code></pre>`;
        };
    }
}
