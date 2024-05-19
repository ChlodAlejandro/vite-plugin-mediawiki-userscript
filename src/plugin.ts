import { Plugin } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import MagicString from 'magic-string';
import { PluginOptions } from './config.js';
import { warn } from './warn.js';
import { wrap } from './wrap.js';

const EXTERN_PREFIX = '\0mw-userscript:';
const IMPORT_REGEX =
	/import ({[^}]+}) from "\/@id\/__x00__mw-userscript:[^"]+";/dg;
const AS_REGEX = / as /dg;
const DYNAMIC_IMPORT_CJS_REGEX = /import\(.+?\.(c)js["']\s?\)/dg;
export default function mediawikiUserscript( options: PluginOptions ): Plugin {
	const externals = Array.from( options.using ?? [] );
	if ( externals.includes( 'vue' ) ) {
		externals.push( '@vue' );
	}

	const cssPlugin = cssInjectedByJsPlugin( {
		injectCode: ( cssCode ) => {
			return `mw.util.addCSS(${cssCode});`;
		},
		relativeCSSInjection: true,
		topExecutionPriority: false
	} );

	type ObjectHook<T, O = {}> =
		| T
		| ( { handler: T; order?: 'pre' | 'post' | null } & O );

	function getHook<T>( hook: ObjectHook<T> ): T {
		return ( hook as any ).handler ?? hook;
	}

	const importers = new Set<string>();

	// ensure trailing slash
	options.baseUrl = options.baseUrl ? options.baseUrl.replace( /\/?$/, '/' ) : '';

	return {
		enforce: 'pre',
		name: 'mediawiki-userscript',
		config( config, env ) {
			config.build ??= {};
			config.build.rollupOptions ??= {};

			// Insert externals
			if ( Array.isArray( config.build.rollupOptions.external ) ) {
				config.build.rollupOptions.external = [
					...( config.build.rollupOptions.external ?? [] ),
					...externals
				];
			} else if (
				config.build.rollupOptions.external instanceof Function
			) {
				config.build.rollupOptions.external = (
					source: string,
					importer: string | undefined,
					isResolved: boolean
				) => {
					return (
						( config.build.rollupOptions.external as Function )(
							source,
							importer,
							isResolved
						) || externals.includes( source )
					);
				};
			} else if ( config.build.rollupOptions.external ) {
				config.build.rollupOptions.external = [
					config.build.rollupOptions.external,
					...externals
				];
			} else {
				config.build.rollupOptions.external = externals;
			}

			if ( options.esmChunks ) {
				config.build.rollupOptions.output = {
					...config.build.rollupOptions.output,

					chunkFileNames: '[name].js',
					minifyInternalExports: false
				};
			}

			config.build.target ??= 'es6';
			config.build.cssCodeSplit ??= true;

			if ( config.build.lib !== undefined && !options.ignoreBuildOptions ) {
				warn(
					'config.lib already set. Not touching it! Set `ignoreBuildOptions` to `true` to remove this warning.'
				);
			} else if ( !config.build.lib ) {
				config.optimizeDeps ??= {};
				const optimizeDepsEntries = config.optimizeDeps.entries?.[ 0 ];

				// Set emitted file
				config.build.lib = {
					entry: optimizeDepsEntries ?? options.entry,
					name: options.name,
					fileName: options.name,
					formats: [ 'cjs' ]
				};

				if ( options.esmChunks ) {
					config.build.lib.formats.push( 'es' );
				}

				if ( !optimizeDepsEntries ) {
					// Indicate this as the entrypoint of our script
					config.optimizeDeps.entries = [ options.entry ];
				}
				config.optimizeDeps.exclude = Array.isArray(
					config.optimizeDeps.exclude
				) ?
					[ ...config.optimizeDeps.exclude, ...externals ] :
					externals;
			}

			getHook( cssPlugin.config ).call( this, config, env );
		},
		configResolved( config ) {
			getHook( cssPlugin.configResolved ).call( this, config );
		},
		resolveId( source, importer ) {
			if ( externals.includes( source ) ) {
				importers.add( importer );
				return EXTERN_PREFIX + source;
			}
		},
		load( id ) {
			if ( id.startsWith( EXTERN_PREFIX ) ) {
				const name = id.slice( EXTERN_PREFIX.length );

				let code = '';
				if ( options.resourceLoaderDebugCookieAge ) {
					code += `document.cookie = "resourceLoaderDebug=2;max-age=${options.resourceLoaderDebugCookieAge}"\n`;
				}
				code += `const __mw_module = (await mw.loader.using(${JSON.stringify( name )}))(${JSON.stringify( name )});\n`;
				code += 'export default __mw_module;\n';
				if ( name === 'vue' ) {
					code +=
						'if (typeof __VUE_HMR_RUNTIME__ !== "object") {\n' +
						'console.error("[vite-mw-userscript] ResourceLoader debug mode is not enabled. Without it, ' +
						'RL will load the production version of Vue. Debug mode Vue is required for HMR to work.\\n\\n';

					if ( options.resourceLoaderDebugCookieAge ) {
						code += `\`resourceLoaderDebugCookieAge\` is set to \`${options.resourceLoaderDebugCookieAge}\`, but Vue was loaded without it. Try reloading the page.`;
					} else {
						code +=
							'Add `?debug=2` to your URL or set a cookie `resourceLoaderDebug=2` to enable it. More information: ' +
							'https://www.mediawiki.org/wiki/ResourceLoader/Architecture#Debug_mode';
					}
					code += '");\n';
					code += '}\n';
				}

				return code;
			}
		},
		transform: {
			order: 'post',
			handler( code, id ) {
				if ( !importers.has( id ) ) {
					return;
				}

				let counter = 0;
				const s = new MagicString( code );
				const matches = code.matchAll( IMPORT_REGEX );
				for ( const match of matches ) {
					// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
					const [ [ _, end ], [ clauseStart, clauseEnd ] ] = match.indices;
					s.appendLeft( end, 'const ' );
					s.appendLeft( clauseEnd, ` = __mw_module${counter};` );
					s.appendLeft( clauseStart, `__mw_module${counter}` );

					const clause = s.slice( clauseStart, clauseEnd );
					const asMatch = clause.matchAll( AS_REGEX );
					for ( const as of asMatch ) {
						s.update(
							clauseStart + as.indices[ 0 ][ 0 ],
							clauseStart + as.indices[ 0 ][ 1 ],
							': '
						);
					}

					s.move( clauseStart, clauseEnd, end );
					counter++;
				}
				return {
					code: s.toString(),
					map: s.generateMap()
				};
			}
		},
		async generateBundle( opts, bundle, isWrite ) {
			await getHook( cssPlugin.generateBundle ).call(
				this,
				opts,
				bundle,
				isWrite
			);

			for ( const [ name, file ] of Object.entries( bundle ) ) {
				if ( file.type === 'chunk' && file.isEntry ) {
					file.code = wrap( options, file.code );
				}
				if ( options.esmChunks && file.type === 'chunk' ) {
					if ( ( opts.format === 'cjs' && !file.isEntry ) || ( opts.format === 'es' && file.isEntry ) ) {
						delete bundle[ name ];
					}
				}
			}
		},

		// esm hackery
		renderDynamicImport() {
			if ( options.esmChunks ) {
				return { left: `import(${ JSON.stringify( options.baseUrl ) } + `, right: ')' };
			}
		},
		renderChunk: ( code, chunk, { format }, { chunks } ) => {
			if ( format !== 'cjs' || !options.esmChunks ) {
				return;
			}
			if ( chunk.name === 'main' ) {
				const s = new MagicString( code );
				const matches = code.matchAll( DYNAMIC_IMPORT_CJS_REGEX );
				for ( const match of matches ) {
					// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
					const [ _, [ start, end ] ] = match.indices;
					s.remove( start, end );
				}

				if ( Array.isArray( options.esmUnhoistChunks ) ) {
					// remove hoisted require( './chunk.xyz.js' )
					const removeChunks = Object.entries( chunks )
					// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
						.filter( ( [ _, c ] ) => options.esmUnhoistChunks.includes( c.name ) )
						.map( ( [ n ] ) => n );

					for ( const chunkName of removeChunks ) {
						if ( chunk.importedBindings[ chunkName ].length !== 0 ) {
							throw new Error( `${chunkName} imports are being used!` );
						}

						delete chunk.importedBindings[ chunkName ];
					}
					chunk.imports = chunk.imports.filter( ( i ) => !removeChunks.includes( i ) );

					const searchStrings = removeChunks.map( c => `require('./${ c }');\n` );

					for ( const searchString of searchStrings ) {
						let idx = code.indexOf( searchString );
						if ( idx === -1 ) {
							throw new Error( `\`${searchString}\` not found!` );
						}

						while ( idx !== -1 ) {
							s.remove( idx, idx + searchString.length );
							idx = code.indexOf( searchString, idx + 1 );
						}
					}
				}
				return {
					code: s.toString(),
					map: s.generateMap()
				};
			}
		}

	};
}
