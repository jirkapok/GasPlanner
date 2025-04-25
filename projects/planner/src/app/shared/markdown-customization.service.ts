import { Injectable } from '@angular/core';
import { Urls } from './navigation.service';
import { NgxMdService } from 'ngx-md';
import { Slugger } from 'marked';

@Injectable()
export class MarkdownCustomization {
    constructor(private urls: Urls, private markdown: NgxMdService) {}

    public configure(): void {
        const renderer = this.markdown.renderer;

        renderer.image = (href: string, _: string, text: string) => {
            const resolvedUrl = this.urls.imageUrl(href);
            return `<img src="${resolvedUrl}" alt="${text}" class="img-fluid p-3" title="${text}">`;
        };

        renderer.link = (href: string, _: string, text: string) => {
            if (href && href.startsWith('./') && href.indexOf('.md') > 0) {
                const sanitizedHref = href.replace('./', '').replace('.md', '');
                const parts = sanitizedHref.split('#');
                return `<a href="/help/${parts[0]}/${parts[1]}">${text}</a>`;
            }
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };

        renderer.heading = (text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string, slugger: Slugger) => {
            // add id to be able scroll to the anchor
            return `<h${level} id="${slugger.slug(raw)}">${text}</h${level}>`;
        }

        renderer.blockquote = (quote: string) => {
            return `<blockquote class="blockquote border-5 border-info border-start p-2 my-2">${quote}</blockquote>`;
        }

        renderer.table = (header: string, body: string) => {
            return `<table class="table table-bordered table-sm">
                        <thead class="table-light">${header}</thead>
                        ${body}
                    </table>`;
        }

        renderer.code = (code: string, language: string) => {
            const lang = language ? language : 'plaintext';
            return `<pre class="bg-light p-2"><code class="language-${lang}">${code}</code></pre>`;
        }
    }
}
