export interface PluginOptions {
	/**
	 * Name of this userscript. Used for the bundle name.
	 */
	name: string;

	/**
	 * Entrypoint of the userscript.
	 */
	entry: string;

	/**
	 * Userscript template. The userscript will be wrapped by this template.
	 * Special substrings in the string will be replaced with the appropriate values:
	 *
	 * - `'script'`: The userscript code.
	 * - `'modules'`: A JSON array of ResourceLoader modules required by the userscript.
	 * - `'header'`: The userscript header, if any.
	 * - `'footer'`: The userscript footer, if any.
	 *
	 * Ensure that the function in which 'script' can be found has `require`
	 * defined. This will be used to import modules during runtime.
	 */
	template?: string;

	/**
	 * Additional banner text. Comment symbols are automatically appended
	 * to the beginning of each line.
	 */
	banner?: string;
	/**
	 * Additional footer text. Comment symbols are automatically appended
	 * to the beginning of each line.
	 */
	footer?: string;

	/**
	 * List all ResourceLoader modules required by the userscript.
	 *
	 * If your userscript requires modules that aren't listed here, they
	 * will be automatically bundled. This allows you to use any module,
	 * but it means some modules could be duplicated if they were already
	 * loaded by the MediaWiki core.
	 *
	 * To avoid duplication, list modules already included in MediaWiki
	 * that your userscript requires here. For example, include `vue`
	 * if you plan to use Vue.js built into MediaWiki. This can also
	 * include critical modules, such as `mediawiki.Api`, which your
	 * userscript requires at runtime.
	 */
	using?: string[];

	/**
	 * By default, this plugin will automatically force the userscript
	 * to compile as one file. This is achieved by enabling Library
	 * Mode on Vite. If an existing `build.lib` has been set, however,
	 * this can cause conflicts. This plugin will not try to override
	 * the `build.lib` option; but warnings will be sent unless this
	 * option is set to `true`.
	 */
	ignoreBuildOptions?: boolean;

	/**
	 * max-age in seconds for the `resourceLoaderDebug` cookie. Falsy values
	 * will not set the cookie. Recommended: 60
	 *
	 * ResourceLoader debug mode is required to load the debug version of the Vue
	 * module. Debug mode Vue is required for HMR to work. Setting this property will
	 * cause the plugin to inject a `resourceLoaderDebug=2` cookie automatically.
	 */
	resourceLoaderDebugCookieAge?: number;

	/**
	 * If set to true, generate chunks as esm instead of commonjs. This also
	 * preserves dynamic imports even in the main cjs chunk.
	 *
	 * @see {@link esmUnhoistChunks}
	 * @see {@link baseUrl}
	 */
	esmChunks?: boolean;
	/**
	 * If set to an array of chunk names, any top level require() calls to
	 * those chunks will be removed. You can use this to prevent rollup from
	 * trying to require your esm chunks that have top level `import` statements,
	 * and load the esm chunk yourself with dynamic import.
	 */
	esmUnhoistChunks?: string[];
	/**
	 * Specify the base URL for importing chunks. For example, a baseUrl of
	 * `https://example.com/` will cause `import('my-chunk')` to resolve to
	 * `import('https://example.com/my-chunk-abcdef.js')`.
	 *
	 * @example baseUrl: 'https://example.com/'
	 * @example baseUrl: process.env.COMMIT ? `https://production.com/${process.env.COMMIT}/` : 'http://localhost:8080/'
	 */
	baseUrl?: string;
}
