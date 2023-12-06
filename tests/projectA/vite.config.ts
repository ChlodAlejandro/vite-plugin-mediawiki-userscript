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
			using: [
				'vue',
				'@wikimedia/codex'
			]
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
		strictPort: true
	}
} );
