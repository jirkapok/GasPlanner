// ngx-markdown optionally imports 'marked-katex-extension' (not installed, katex is never enabled).
// Vitest can't pre-bundle the unresolved import, so it is aliased to this empty module in vitest-base.config.mts.
export default undefined;
