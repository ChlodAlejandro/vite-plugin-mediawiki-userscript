import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PluginOptions } from './config.js';

export function wrap( options: PluginOptions, code: string ): string {
	const template =
		options.template ??
		readFileSync(
			resolve(
				dirname( fileURLToPath( import.meta.url ) ),
				'../assets/userscript.js'
			)
		).toString( 'utf8' );

	const header =
		options.banner
			?.split( '\n' )
			?.map( ( v ) => `// ${v}`.trim() )
			?.join( '\n' )
			?.trimEnd() ?? '';
	const footer =
		options.footer
			?.split( '\n' )
			?.map( ( v ) => `// ${v}`.trim() )
			?.join( '\n' )
			?.trimStart() ?? '';

	const processedTemplate = template
		.replace( /'modules'/g, JSON.stringify( options.using, null, '\t' ) )
		.replace( /'header';\n/g, header )
		.replace( /'footer';(\r\n$|\n$)?/g, footer );

	if ( Array.from( processedTemplate.matchAll( /'script'/g ) ).length !== 1 ) {
		throw new Error(
			"Userscript template does not have exactly one 'script' tag."
		);
	}

	const emitSplit = processedTemplate.split( /^\s+'script';/m, 2 );
	return `${emitSplit[ 0 ]}\n${code}\n${emitSplit[ 1 ]}`;
}
