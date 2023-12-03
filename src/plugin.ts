import { Plugin } from 'vite';
import { PluginOptions } from './config';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { warn } from './warn';
import { wrap } from './wrap';

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

	type ObjectHook<T, O = {}> = T | ( { handler: T; order?: 'pre' | 'post' | null } & O );

	function getHook<T>( hook: ObjectHook<T> ): T {
		return ( hook as any ).handler ?? hook;
	}

	return {
		apply: 'build',
		enforce: 'post',
		name: 'mediawiki-userscript',
		config( config, env ) {
			config.build ??= {};
			config.build.rollupOptions ??= {};

			// Insert externals
			if ( Array.isArray( config.build.rollupOptions.external ) ) {
				config.build.rollupOptions.external = [
					...config.build.rollupOptions.external ?? [],
					...externals
				];
			} else if ( config.build.rollupOptions.external instanceof Function ) {
				config.build.rollupOptions.external =
					( source: string, importer: string | undefined, isResolved: boolean ) => {
						return ( config.build.rollupOptions.external as Function )(
							source, importer, isResolved
						) || externals.includes( source );
					};
			} else if ( config.build.rollupOptions.external ) {
				config.build.rollupOptions.external =
					[ config.build.rollupOptions.external, ...externals ];
			} else {
				config.build.rollupOptions.external = externals;
			}

			config.build.target ??= 'es6';
			config.build.cssCodeSplit ??= true;

			if ( config.build.lib !== undefined && !options.ignoreBuildOptions ) {
				warn( 'config.lib already set. Not touching it! Set `ignoreBuildOptions` to `true` to remove this warning.' );
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

				// Disable code splitting
				if ( config.build.rollupOptions.output ) {
					if ( Array.isArray( config.build.rollupOptions.output ) ) {
						for ( const output of config.build.rollupOptions.output ) {
							if ( ![ 'cjs', 'commonjs' ].includes( output.format ) ) {
								warn( 'One output file does not have a `cjs` format. It will not work on runtime!' );
								warn( '`mw.loader.using` only supports CommonJS imports.' );
							}
							output.manualChunks = undefined;
						}
					} else {
						config.build.rollupOptions.output.manualChunks = undefined;
					}
				} else {
					config.build.rollupOptions.output = { manualChunks: undefined };
				}

				if ( !optimizeDepsEntries ) {
					// Indicate this as the entrypoint of our script
					config.optimizeDeps.entries = [ options.entry ];
				}
				config.optimizeDeps.exclude =
					Array.isArray( config.optimizeDeps.exclude ) ?
						[ ...config.optimizeDeps.exclude, ...( externals ) ] :
						externals;
			}

			getHook( cssPlugin.config ).call( this, config, env );
		},
		configResolved( config ) {
			getHook( cssPlugin.configResolved ).call( this, config );
		},
		async generateBundle( opts, bundle, isWrite ) {
			await getHook( cssPlugin.generateBundle ).call( this, opts, bundle, isWrite );

			for ( const file of Object.values( bundle ) ) {
				if ( file.type === 'chunk' && file.isEntry ) {
					file.code = wrap( options, file.code );
				}
			}
		}
	};
}
