import { MarkedExtension, Tokens } from 'marked';
import { Urls } from './navigation.service';
import { HeadingSlugger } from './headingSlugger';

const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
};

const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, c => htmlEntities[c]);

const unescapeHtml = (html: string): string => html.replace(/&(amp|lt|gt|quot|#39);/g,
    entity => Object.keys(htmlEntities).find(k => htmlEntities[k] === entity) ?? entity);

/** Renders the help documents (doc/*.md) with application links, heading anchors and Bootstrap styles. */
export function markdownDocsExtension(urls: Urls): MarkedExtension {
    const slugger = new HeadingSlugger();

    return {
        hooks: {
            // heading ids are unique per document
            preprocess(markdown: string): string {
                slugger.reset();
                return markdown;
            }
        },
        renderer: {
            image({ href, text }: Tokens.Image): string {
                const resolvedUrl = urls.imageUrl(href);
                return `<img src="${resolvedUrl}" alt="${text}" class="img-fluid p-3" title="${text}">`;
            },

            link({ href, tokens }: Tokens.Link): string {
                const text = this.parser.parseInline(tokens);

                if (href && href.startsWith('./') && href.indexOf('.md') > 0) {
                    const sanitizedHref = href.replace('./', '').replace('.md', '');
                    const parts = sanitizedHref.split('#');
                    const helpUrl = urls.helpUrl(parts[0], parts[1]);
                    return `<a href="${helpUrl}">${text}</a>`;
                } else if (href && href.startsWith('/learn')) {
                    return `<a href="${href}">${text}</a>`;
                }

                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            },

            // add id to be able scroll to the anchor
            heading({ tokens, depth }: Tokens.Heading): string {
                const text = this.parser.parseInline(tokens);
                const plainText = unescapeHtml(this.parser.parseInline(tokens, this.parser.textRenderer));
                return `<h${depth} id="${slugger.slug(plainText)}">${text}</h${depth}>`;
            },

            blockquote({ tokens }: Tokens.Blockquote): string {
                const quote = this.parser.parse(tokens);
                return `<blockquote class="blockquote border-5 border-info border-start p-2 my-2">${quote}</blockquote>`;
            },

            table(token: Tokens.Table): string {
                const renderRow = (cells: Tokens.TableCell[]) => this.tablerow({ text: cells.map(c => this.tablecell(c)).join('') });
                const header = renderRow(token.header);
                const body = token.rows.map(renderRow).join('');
                return `<table class="table table-bordered table-sm">
                        <thead class="table-light">${header}</thead>
                        <tbody>${body}</tbody>
                    </table>`;
            },

            code({ text, lang, escaped }: Tokens.Code): string {
                const language = lang ? lang : 'plaintext';
                const content = escaped ? text : escapeHtml(text);
                return `<pre class="bg-light p-2 overflow-auto"><code class="language-${language}">${content}</code></pre>`;
            }
        }
    };
}
