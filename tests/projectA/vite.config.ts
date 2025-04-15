import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import inspect from 'vite-plugin-inspect';
import mediawikiUserscript from '../..';

// https://vitejs.dev/config/
export default defineConfig( {
	clearScreen: false,
	plugins: [
		mediawikiUserscript( {
			name: 'plugin-test',
			entry: './src/main.ts',
			using: [ 'vue', '@wikimedia/codex' ],
			resourceLoaderDebugCookieAge: 60
		} ),
		vue(),
		inspect()
	],
	resolve: {
		alias: {
			'@': fileURLToPath( new URL( './src', import.meta.url ) )
		}
	},
	server: {
		hmr: true,
		strictPort: true,
		// You should always set these two configuration options to a specific set of domains!
		allowedHosts: true,
		headers: {
			'Access-Control-Allow-Origin': '*'
		}
	}
} );
