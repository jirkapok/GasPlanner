import { Marked } from 'marked';
import { markdownDocsExtension } from './markdownDocs';
import { Urls } from './navigation.service';

describe('Markdown docs extension', () => {
    const createMarked = () => new Marked(markdownDocsExtension(new Urls()));
    const render = (md: string) => createMarked().parse(md) as string;
    const withoutTagSpaces = (html: string) => html.replace(/>\s+</g, '><');

    it('resolves image from docs assets', () => {
        expect(render('![Target depth](./target_depth_properties.png)'))
            .toContain('<img src="assets/doc/target_depth_properties.png" alt="Target depth" class="img-fluid p-3" title="Target depth">');
    });

    describe('Links', () => {
        it('rewrites doc link with anchor to help url', () => {
            expect(render('[toxicity](./diveinfo.md#oxygen-toxicity)'))
                .toContain('<a href="/help/diveinfo/oxygen-toxicity">toxicity</a>');
        });

        it('rewrites doc link without anchor to help url', () => {
            expect(render('[tanks](./tanks.md)')).toContain('<a href="/help/tanks/">tanks</a>');
        });

        it('keeps learn link in the application', () => {
            expect(render('[quiz](/learn)')).toContain('<a href="/learn">quiz</a>');
        });

        it('opens external link in new tab', () => {
            expect(render('[site](https://dugong.online/)'))
                .toContain('<a href="https://dugong.online/" target="_blank" rel="noopener noreferrer">site</a>');
        });

        it('renders inline formatting in link text', () => {
            expect(render('[**bold**](https://x.org)')).toContain('<strong>bold</strong></a>');
        });
    });

    describe('Heading ids', () => {
        it('adds anchor id to heading', () => {
            expect(render('## Repetitive dives and Surface interval'))
                .toContain('<h2 id="repetitive-dives-and-surface-interval">Repetitive dives and Surface interval</h2>');
        });

        it('creates id from unescaped text', () => {
            expect(render('## Gases & Air')).toContain('<h2 id="gases--air">Gases &amp; Air</h2>');
        });

        it('adds counter to duplicate headings in one document', () => {
            const html = render('## Gases\n\n## Gases');
            expect(html).toContain('id="gases"');
            expect(html).toContain('id="gases-1"');
        });

        it('restarts ids for every parsed document', () => {
            const marked = createMarked();
            void marked.parse('## Gases');
            const second = marked.parse('## Gases') as string;
            expect(second).toContain('id="gases"');
            expect(second).not.toContain('gases-1');
        });
    });

    it('styles blockquote', () => {
        expect(withoutTagSpaces(render('> Note')))
            .toContain('<blockquote class="blockquote border-5 border-info border-start p-2 my-2"><p>Note</p></blockquote>');
    });

    it('styles table', () => {
        const html = render('| A | B |\n|---|---|\n| 1 | 2 |');
        expect(html).toContain('<table class="table table-bordered table-sm">');
        expect(html).toContain('<thead class="table-light">');
        expect(html).toContain('<th>A</th>');
        expect(html).toContain('<td>2</td>');
        expect(html.split('<table').length - 1).toBe(1);
    });

    describe('Code', () => {
        it('styles code with language', () => {
            expect(render('```text\nabc\n```'))
                .toContain('<pre class="bg-light p-2 overflow-auto"><code class="language-text">abc</code></pre>');
        });

        it('uses plaintext language when not defined', () => {
            expect(render('```\nabc\n```')).toContain('class="language-plaintext"');
        });

        it('escapes code block text', () => {
            expect(render('```\na < b & c\n```')).toContain('a &lt; b &amp; c');
        });
    });
});
