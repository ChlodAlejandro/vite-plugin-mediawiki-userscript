import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PluginOptions } from './config';

export function wrap( options: PluginOptions, code: string ): string {
	const template = options.template ??
		// eslint-disable-next-line no-undef,security/detect-non-literal-fs-filename
		readFileSync( resolve( __dirname, '../assets/userscript.js' ) )
			.toString( 'utf8' );

	const header = options.banner
		?.split( '\n' )
		?.map( v => `// ${v}`.trim() )
		?.join( '\n' )
		?.trimEnd() ??
		'';
	const footer = options.footer
		?.split( '\n' )
		?.map( v => `// ${v}`.trim() )
		?.join( '\n' )
		?.trimStart() ??
		'';

	const processedTemplate = template
		.replace( /'modules'/g, JSON.stringify( options.using, null, '\t' ) )
		.replace( /'header';\n/g, header )
		.replace( /'footer';(\r\n$|\n$)?/g, footer );

	if ( Array.from( processedTemplate.matchAll( /'script'/g ) ).length !== 1 ) {
		throw new Error( "Userscript template does not have exactly one 'script' tag." );
	}

	const emitSplit = processedTemplate.split(
		/^\s+'script';/m,
		2
	);
	return `${emitSplit[ 0 ]}\n${code}\n${emitSplit[ 1 ]}`;
}
