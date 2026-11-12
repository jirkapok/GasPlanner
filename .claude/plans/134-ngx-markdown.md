# Replace ngx-md by ngx-markdown (#134) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the Help page, the help sidebar and the Learn help panel with `ngx-markdown` instead of the unmaintained `ngx-md`, with no visible change in content, layout, links or anchors.

**Architecture:** The six renderer overrides of today's `MarkdownCustomization` service become one pure marked extension, `markdownDocsExtension(urls)`, written for the marked 18 token API and unit-testable with `new Marked(...)` without Angular. Heading ids keep the exact marked 4 `Slugger` algorithm through our own `HeadingSlugger`, so every existing anchor and shared `/help/:document/:anchor` link keeps working. `provideDocsMarkdown()` wraps `provideMarkdown()` (HTTP loader + the extension) and is the single setup used by `app.config.ts` and by specs; components use the standalone `MarkdownComponent`.

**Tech Stack:** Angular 22 (zoneless, OnPush, standalone), ngx-markdown 22.1.1, marked 18, Vitest browser mode.

**Spec:** GitHub issue #134 ("Replace ngx-md by ngx-markdown": no reference to ngx-md, new alternative added, no dramatic change in help and learn pages behavior or layout) plus the analysis in this session (feature comparison table, recommendation to pin current behavior by tests first).

## Global Constraints
- Branch `feat/134-ngx-markdown`, created from the latest `origin/master` (already done, upstream unset).
- Commits: Conventional Commits with the issue prefix, e.g. `refactor(planner): #134 render help with ngx-markdown`; each ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Versions: `ngx-markdown@22.1.1` and `marked@^18.2.0` as direct `dependencies` (ngx-markdown accepts marked `^17 || ^18`). Do not add `prismjs`, `katex`, `mermaid`, `clipboard`, `emoji-toolkit` or `marked-gfm-heading-id`.
- Install with `npm install --legacy-peer-deps` (same flag as CI); do not change CI flags in this ticket.
- Rendered HTML must keep the current Bootstrap classes exactly: images `img-fluid p-3`, blockquotes `blockquote border-5 border-info border-start p-2 my-2`, tables `table table-bordered table-sm` with `thead.table-light`, code `pre.bg-light.p-2.overflow-auto > code.language-<lang|plaintext>`.
- Sanitization stays disabled only on our three `<markdown>` tags via `[disableSanitizer]="true"` (global default stays sanitized).
- Planner code tests are component tests; the pure extension gets plain unit specs next to it. Shared test helpers go to `*.testing.ts`, never exported from a spec.
- Run each task's verification with `npm run test-ci` and `npm run lint`. Ask the user to stop their own `ng serve` on port 4200 first if a run fails with port/lock errors.
- Single-spec pattern: `npx ng test planner --no-watch --include='**/markdownDocs.spec.ts'`.

## Review Focus
1. **Anchor compatibility:** every anchor used by the help menu (`help.component.ts`) and by `./x.md#anchor` links in `doc/*.md` (`repetitive-dives-and-surface-interval`, `oxygen-toxicity`, `diver`, `gases`, `air-breaks`, `tissues-heat-map`, `mccr`, `eccr`) must still be produced for its heading. A different slug library would silently break deep links (Task 1 "heading ids" tests).
2. **Headings with punctuation, emoji, `&` or repeated text** must slug exactly like marked 4 (`Depth(s)` → `depths`, `📘 Learn Help Guide` → `📘-learn-help-guide`, second `Gases` → `gases-1`), and the duplicate counter must restart for every document, otherwise the second opened document gets `-1` suffixes everywhere (Task 1 slugger tests + "restarts ids for every parsed document").
3. **Anchor scroll timing:** opening `/help/depths/repetitive-dives-and-surface-interval` must scroll after the document is rendered, i.e. on `(ready)`, not `(load)` which fires before the HTML exists (Task 2 "scrolls to anchor after document rendered").
4. **Code blocks containing `<` or `&`** must show as text, not be parsed as HTML (Task 1 "escapes code block text").
5. **Global marked state:** ngx-markdown applies extensions to the global `marked` once per `MarkdownService` instance, so repeated TestBeds (and the sidebar plus Help page both open) must not double-wrap output, e.g. nested `<table>` or duplicated classes (Task 2 sidebar + help test and Task 1 tests asserting exact output).

## File Structure
| File | Responsibility |
|---|---|
| Create `projects/planner/src/app/shared/headingSlugger.ts` | marked 4 compatible heading slug with per-document duplicate counter. |
| Create `projects/planner/src/app/shared/headingSlugger.spec.ts` | Slug unit tests. |
| Create `projects/planner/src/app/shared/markdownDocs.ts` | `markdownDocsExtension(urls)` renderer overrides + `provideDocsMarkdown()`. |
| Create `projects/planner/src/app/shared/markdownDocs.spec.ts` | Extension output tests with `new Marked(...)`. |
| Delete `projects/planner/src/app/shared/markdown-customization.service.ts` | Replaced by `markdownDocs.ts` (Task 2). |
| Modify `app.config.ts`, `help/*`, `help-sidebar/*`, `learn/*`, `shared/startUp.spec.ts` | Switch to `MarkdownComponent` / `provideDocsMarkdown()` (Task 2). |
| Modify `package.json`, `package-lock.json`, `.claude/CLAUDE.md` | Dependencies and docs (Tasks 1 and 3). |

---

### Task 1: Docs markdown extension for marked 18

- [x] Status

**Files:**
- Create: `projects/planner/src/app/shared/headingSlugger.ts`, `headingSlugger.spec.ts`, `markdownDocs.ts`, `markdownDocs.spec.ts` (all in `shared/`)
- Modify: `package.json`, `package-lock.json`
- Modify: `projects/planner/src/app/shared/markdown-customization.service.ts:4,31` (only the `Slugger` type import, see Step 1)

**Interfaces:**
- Produces: `class HeadingSlugger { slug(text: string): string; reset(): void; }`
- Produces: `function markdownDocsExtension(urls: Urls): MarkedExtension` (`MarkedExtension` from `marked`)
- `provideDocsMarkdown()` is added in Task 2, not here.

- [ ] **Step 1: Install dependencies and keep ngx-md compiling**

Run: `npm install ngx-markdown@22.1.1 marked@^18.2.0 --legacy-peer-deps`
Root `marked` becomes v18, so `import { Slugger } from 'marked'` in `markdown-customization.service.ts` no longer compiles. Replace it with a local type `type Slugger = { slug(value: string): string };` (ngx-md keeps its own nested marked 4 at runtime; this file is deleted in Task 2).
Check: `npm ls marked` shows `marked@18.x` at root and `marked@4.3.0` under `ngx-md`.

- [ ] **Step 2: Write failing slugger tests** in `headingSlugger.spec.ts` (`describe('HeadingSlugger')`), each on a fresh `new HeadingSlugger()`:
  - `slug('Repetitive dives and Surface interval')` → `'repetitive-dives-and-surface-interval'`
  - `slug('Tissues heat map')` → `'tissues-heat-map'`, `slug('mCCR')` → `'mccr'`
  - `slug('Depth(s)')` → `'depths'`
  - `slug('Conservatism - Gradient Factors (Dive options)')` → `'conservatism---gradient-factors-dive-options'`
  - `slug('RMV/SAC')` → `'rmvsac'`, `slug('Why Dugong planner?')` → `'why-dugong-planner'`
  - `slug('📘 Learn Help Guide')` → `'📘-learn-help-guide'`
  - `slug('Gases & Air')` → `'gases--air'`
  - duplicates: `slug('Gases')`, `slug('Gases')`, `slug('Gases')` → `'gases'`, `'gases-1'`, `'gases-2'`
  - `reset()`: `slug('Gases')`, `reset()`, `slug('Gases')` → second is `'gases'`

- [ ] **Step 3: Run** `npx ng test planner --no-watch --include='**/headingSlugger.spec.ts'` → FAIL (module not found).

- [ ] **Step 4: Implement `HeadingSlugger`** in `headingSlugger.ts`, port of marked 4.3 `Slugger`:

```ts
const base = text.toLowerCase().trim()
    .replace(/<[!/a-z].*?>/ig, '')
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-');
// duplicates: keep a Map<string, number> of seen slugs; for a seen slug append `-${n}`
// with n counting up from 1 until the result is unused, and mark both base and result as seen.
```

- [ ] **Step 5: Run** the same command → PASS.

- [ ] **Step 6: Write failing extension tests** in `markdownDocs.spec.ts`. Helper inside the spec: `const render = (md: string) => new Marked(markdownDocsExtension(new Urls())).parse(md) as string;`. Assertions (use `toContain` on the exact fragment):
  - **image:** `![Target depth](./target_depth_properties.png)` → contains `<img src="assets/doc/target_depth_properties.png" alt="Target depth" class="img-fluid p-3" title="Target depth">`
  - **doc link with anchor:** `[toxicity](./diveinfo.md#oxygen-toxicity)` → `<a href="/help/diveinfo/oxygen-toxicity">toxicity</a>`
  - **doc link without anchor:** `[tanks](./tanks.md)` → `<a href="/help/tanks/">tanks</a>`
  - **learn link:** `[quiz](/learn)` → `<a href="/learn">quiz</a>`
  - **external link:** `[site](https://dugong.online/)` → `<a href="https://dugong.online/" target="_blank" rel="noopener noreferrer">site</a>`
  - **inline formatting in link text:** `[**bold**](https://x.org)` → contains `<strong>bold</strong></a>`
  - **heading ids:** `## Repetitive dives and Surface interval` → `<h2 id="repetitive-dives-and-surface-interval">Repetitive dives and Surface interval</h2>`; `## Gases & Air` → `<h2 id="gases--air">Gases &amp; Air</h2>`
  - **duplicate headings in one document:** `## Gases\n\n## Gases` → contains `id="gases"` and `id="gases-1"`
  - **restarts ids for every parsed document:** with ONE `Marked` instance parse `## Gases` twice; the second output contains `id="gases"` and not `gases-1`
  - **blockquote:** `> Note` → `<blockquote class="blockquote border-5 border-info border-start p-2 my-2"><p>Note</p>\n</blockquote>` (compare after removing whitespace between tags if marked adds newlines)
  - **table:** `| A | B |\n|---|---|\n| 1 | 2 |` → contains `<table class="table table-bordered table-sm">`, `<thead class="table-light">`, `<th>A</th>`, `<td>2</td>`, exactly one `<table` occurrence
  - **code with language:** "```text\nabc\n```" → `<pre class="bg-light p-2 overflow-auto"><code class="language-text">abc</code></pre>`
  - **code without language:** "```\nabc\n```" → contains `class="language-plaintext"`
  - **escapes code block text:** "```\na < b & c\n```" → contains `a &lt; b &amp; c`

- [ ] **Step 7: Run** `npx ng test planner --no-watch --include='**/markdownDocs.spec.ts'` → FAIL (module not found).

- [ ] **Step 8: Implement `markdownDocsExtension(urls: Urls): MarkedExtension`** in `markdownDocs.ts`:
  - One `HeadingSlugger` per extension; `hooks: { preprocess(md) { slugger.reset(); return md; } }`.
  - `renderer` uses regular `function`s (not arrows) so `this.parser` works. Same output as `markdown-customization.service.ts`, mapped to tokens:
    - `image({ href, text })`: same as today, `urls.imageUrl(href)`.
    - `link({ href, tokens })`: text = `this.parser.parseInline(tokens)`; the three branches unchanged.
    - `heading({ tokens, depth })`: inner = `this.parser.parseInline(tokens)`; id = `slugger.slug(unescape(this.parser.parseInline(tokens, this.parser.textRenderer)))`. `unescape` is a small local function decoding `&amp; &lt; &gt; &quot; &#39;`.
    - `blockquote({ tokens })`: `this.parser.parse(tokens)` inside the classed `<blockquote>`.
    - `table(token)`: header row = `token.header` cells via `this.tablecell(cell)` wrapped with `this.tablerow({ text })`; body rows the same from `token.rows`; output `<table class="table table-bordered table-sm"><thead class="table-light">…</thead><tbody>…</tbody></table>`.
    - `code({ text, lang, escaped })`: `escaped ? text : escapeHtml(text)` inside the classed `pre`/`code`; `lang || 'plaintext'`. `escapeHtml` encodes `& < > " '`.

- [ ] **Step 9: Run** both specs → PASS; then `npm run test-ci` → all green (ngx-md still renders the app), and `npm run lint` → no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json projects/planner/src/app/shared/headingSlugger*.ts projects/planner/src/app/shared/markdownDocs*.ts projects/planner/src/app/shared/markdown-customization.service.ts
git commit -m "feat(planner): #134 docs markdown extension for marked 18"
```

---

### Task 2: Render help and learn with ngx-markdown

- [ ] Status

**Files:**
- Modify: `projects/planner/src/app/shared/markdownDocs.ts` (add provider function)
- Modify: `projects/planner/src/app/app.config.ts:21,262`
- Modify: `help/help.component.ts`, `help/help.component.html:45`, `help/help.component.spec.ts`
- Modify: `help-sidebar/help-sidebar.component.ts`, `help-sidebar/help-sidebar.component.html:14`
- Modify: `learn/learn.component.ts`, `learn/learn.component.html:179`, `learn/learn.component.spec.ts`
- Modify: `shared/startUp.spec.ts`
- Delete: `shared/markdown-customization.service.ts`

**Interfaces:**
- Consumes: `markdownDocsExtension(urls: Urls): MarkedExtension` (Task 1)
- Produces: `function provideDocsMarkdown(): ReturnType<typeof provideMarkdown>` in `markdownDocs.ts` = `provideMarkdown({ loader: HttpClient, markedExtensions: [{ provide: MARKED_EXTENSIONS, useFactory: markdownDocsExtension, deps: [Urls], multi: true }] })`.

- [ ] **Step 1: Switch the existing specs to the new setup (they become failing tests)**
  - `help.component.spec.ts` (both describes), `learn.component.spec.ts`: remove `NgxMdModule` from `imports`, add `provideDocsMarkdown()` to `providers`.
  - `startUp.spec.ts`: replace `importProvidersFrom(NgxMdModule.forRoot())` with `provideDocsMarkdown()`.

- [ ] **Step 2: Add failing component tests** in `help.component.spec.ts`, `describe('Help component OnPush')`, same setup as the existing "renders document loaded asynchronously":
  - **renders docs html:** flush `application.md` with `'## Repetitive dives and Surface interval\n\n[toxicity](./diveinfo.md#oxygen-toxicity)'`; after `whenStable()` the element contains `h2#repetitive-dives-and-surface-interval` and `a[href="/help/diveinfo/oxygen-toxicity"]`.
  - **scrolls to anchor after document rendered:** `vi.spyOn(Element.prototype, 'scrollIntoView')`; after the initial render call `component.updatePath({ path: 'depths', anchor: 'repetitive-dives-and-surface-interval' })` (its own immediate scroll finds no element yet); `await fixture.whenStable()`; flush `depths.md` with `'## Repetitive dives and Surface interval'`; after `whenStable()` expect the spy to have been called with `this` equal to the `h2#repetitive-dives-and-surface-interval` element (`spy.mock.contexts`).
  - **does not double-render when sidebar and help both render:** render `HelpSidebarComponent` and `HelpComponent` in the same TestBed, flush both documents with the table from Task 1; expect exactly one `table` element per host (`querySelectorAll('table').length === 1` for each) and `class="table table-bordered table-sm"` unchanged.

- [ ] **Step 3: Run** `npx ng test planner --no-watch --include='**/help.component.spec.ts'` → FAIL (`provideDocsMarkdown` not exported / no `<markdown>` rendering).

- [ ] **Step 4: Implement**
  - `markdownDocs.ts`: add `provideDocsMarkdown()` as in Interfaces.
  - `app.config.ts`: remove `NgxMdModule` import and `NgxMdModule.forRoot()`; add `provideDocsMarkdown()` to the providers list.
  - Templates: `<ngx-md [path]="X" [sanitizeHtml]="false" …></ngx-md>` → `<markdown [src]="X" [disableSanitizer]="true" …></markdown>`; Help page `(loaded)="scrollToAnchor()"` → `(ready)="scrollToAnchor()"`.
  - Components (`help`, `help-sidebar`, `learn`): replace `NgxMdModule` with `MarkdownComponent` from `ngx-markdown` in `imports`; remove `providers: [MarkdownCustomization]`, the constructor parameter and the `configure()` call.
  - Delete `markdown-customization.service.ts`.

- [ ] **Step 5: Run** `npx ng test planner --no-watch --include='**/{help,learn,help-sidebar}.component.spec.ts'` and `--include='**/startUp.spec.ts'` → PASS.

- [ ] **Step 6: Run** `npm run test-ci` → all green; `npm run lint` → no errors.

- [ ] **Step 7: Manual check** with `npm start` (http://localhost:4200): open `/help/depths/repetitive-dives-and-surface-interval` (scrolls to the section), a page with a table (`/help/gas_properties/`), an image (`/help/tanks/`), click a `./x.md#anchor` link and an external link (new tab), open the help sidebar from a dashboard info icon and the Learn page help panel. Compare against https://dugong.online/ for layout.

- [ ] **Step 8: Commit**

```bash
git add -A projects/planner/src/app
git commit -m "refactor(planner): #134 render help and learn pages with ngx-markdown"
```

---

### Task 3: Remove ngx-md

- [ ] Status

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `.claude/CLAUDE.md` (sections "App composition" and "Docs / Help")

**Interfaces:**
- Consumes: Task 2 leaves no import of `ngx-md`.

- [ ] **Step 1: Verify no references remain**
Run: Grep `ngx-md|NgxMd|prismjs` over the repo excluding `node_modules`, `dist`, `.angular`, `coverage`, `package-lock.json`, `doc/CHANGELOG.md`, `.claude/plans/` → matches only in `package.json` and `.claude/CLAUDE.md`.

- [ ] **Step 2: Uninstall** `npm uninstall ngx-md --legacy-peer-deps`.
Check: `npm ls ngx-md prismjs` → empty; `npm ls marked` → only `marked@18.x` for the app (semantic-release may keep its own copies).

- [ ] **Step 3: Update `.claude/CLAUDE.md`**: in "App composition", replace `NgxMdModule` in the example list of third-party modules with `provideDocsMarkdown()` (ngx-markdown); in "Docs / Help", replace "using `ngx-md`" with "using `ngx-markdown` (setup and marked renderer overrides in `shared/markdownDocs.ts`; heading anchors from `HeadingSlugger`, compatible with the old marked 4 ids)".

- [ ] **Step 4: Verify the whole build**
Run: `npm run build-lib`, then `npm run build` → succeeds with no new warnings (no CommonJS warning for marked). Then `npm run test-ci` and `npm run lint` → green.
Run: `npm run start-pwa` and open http://localhost:9090/help/depths/repetitive-dives-and-surface-interval → renders and scrolls; reload with DevTools offline → help still renders from the service worker cache.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .claude/CLAUDE.md
git commit -m "chore(planner): #134 remove ngx-md dependency"
```
