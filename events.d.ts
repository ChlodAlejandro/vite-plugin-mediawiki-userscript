// events.d.ts
import 'vite/types/customEvent';

declare module 'vite/types/customEvent' {
	// noinspection JSUnusedGlobalSymbols
	interface CustomEventMap {
		'mediawiki-userscript:getExports': {
			requestId: string,
			modules: string[]
		},
		'mediawiki-userscript:exports': {
			requestId: string,
			exportMap: Record<string, string[]>
		}
	}
}
