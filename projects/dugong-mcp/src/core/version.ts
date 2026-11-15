/** Replaced by the bundler (see build/build-mcp.ps1) with the released version */
// eslint-disable-next-line @typescript-eslint/naming-convention -- global constant defined by esbuild --define
declare const __DUGONG_VERSION__: string | undefined;

export const serverName = 'dugong';

export const serverVersion: string = typeof __DUGONG_VERSION__ === 'string' ? __DUGONG_VERSION__ : '0.0.0-dev';
