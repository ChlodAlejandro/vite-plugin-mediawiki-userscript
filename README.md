# vite-plugin-mediawiki-userscript
Create MediaWiki userscripts built by Vite.

[MediaWiki user scripts](https://w.wiki/4s8Q) are user-generated JavaScript
files stored on a MediaWiki wiki. They allow users to create their own
client-side code to automate tasks, customize the interface, or improve the
reading experience.

This plugin allows you to use [Vite](https://vitejs.dev/) to build MediaWiki
userscripts, and handles much of the configuration required to get a
single JavaScript file emitted for use in MediaWiki.

## Usage
### Installation
```sh
npm install --save-dev vite-plugin-mediawiki-userscript
```

### Configuration
`name` and `entry` are required. All other options are optional.
- `name` is the name of the userscript. The userscript will be output to `dist/<name>.js`.
- `entry` is the entry point of the userscript. This is the file that will be
  executed once modules are loaded.
```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts'
			// Configuration options
		}),
	]
});
```

### ResourceLoader modules

You may require some ResourceLoader modules as soon as your code loads.
By providing a `using` option, these modules will automatically be loaded
prior to your code being executed. This is useful in cases where you want
to use the Vue.js or [Codex](https://www.mediawiki.org/wiki/Codex) libraries
bundled into MediaWiki.

```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',
			using: [
				'vue',
				'@wikimedia/codex'
			]
		}),
	]
});
```

You can then import them normally in your code. If the Vue plugin of Vite
is enabled, you will be able to use SFC (`.vue`) files seamlessly with
the MediaWiki-provided Vue.js. No need to bundle Vue.js as part of your
userscript.

Note that you should avoid importing styles from these modules, such as
`@wikimedia/codex/dist/codex.style.css`, as this would have already been
loaded by MediaWiki. Importing these styles would only cause additional
overhead.

### Development usage

In Vite's `serve` mode, any import statements containing modules in `using`
will be automatically replaced with a `mw.loader.using()` call. You can add the
following code to your `common.js` to load your script (see
[Special:Diff/1220923810](https://en.wikipedia.org/w/index.php?diff=1220923810)
for an example):

```js
function loadModule( src ) {
	var e = document.createElement( 'script' );
	e.setAttribute( 'type', 'module' );
	e.setAttribute( 'src', src );
	document.head.appendChild( e );
}

// Userscript development
loadModule( 'http://localhost:5173/@vite/client' );
loadModule( 'http://localhost:5173/src/main.ts' );
```

Note that Vue HMR is not included by default in the ResourceLoader module. You
need to enable [ResourceLoader debug mode](https://www.mediawiki.org/wiki/ResourceLoader/Architecture#Debug_mode)
to get the development build of Vue from ResourceLoader by adding `?debug=2` to
the end of the URL (e.g. `https://en.wikipedia.org/wiki/Main_Page?debug=2`)
or by setting a `resourceLoaderDebug=2` cookie. You can also use this plugin to
automatically set this cookie, by changing the `resourceLoaderDebugCookieAge`
to any truthy value (recommended is 60 seconds). This will inject the cookie for
the specified seconds every time a RL module is loaded. Real builds will not be
affected, this only applies in serve mode.
```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',

			// automatically set the debug cookie for 60 seconds, see #Development usage
			// default is null (don't set cookie)
			resourceLoaderDebugCookieAge: 60
		}),
	]
});
```

### Output options

You can apply a header and footer to the userscript by providing `header` and
`footer` options. These will be prepended and appended to the userscript
respectively.
```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',
			header: '// my-userscript, maintained by [[User:Chlod]]',
			footer: '// end of script'
		}),
	]
});
```

If you'd like to take full control of the template JavaScript file used to
output the final userscript, you can pass the `template` options with the
template to use.
```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',
			template: `
				mw.loader.using( 'dependencies', function ( require ) {
					// Userscript code
				} );
			`.trim()
		}),
	]
});
```

## Advanced configuration
### Taking full control of bundle outputs
This plugin takes over the configuration and enables
[Library Mode](https://vitejs.dev/guide/build.html#library-mode) by default.
This allows the userscript to be built into one single file that can then
be loaded using `importScript` or `mw.loader.load`. To take control of the
way bundles are generated, set `build.lib` to `false` (or whichever
configuration you desire) and set the `ignoreBuildOptions` option to `true`.

```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',
			build: {
				lib: false
			},
			ignoreBuildOptions: true,
			rollupOptions: {
				output: {
					// ...
				}
			}
		}),
	]
});
```

### Code splitting
You can use ESM modules and dynamic imports in order to split your userscript
into lazy-loadable chunks. To do this, enable the `esmChunks` option in the plugin
config. This will cause your entrypoint to still be CJS and compatible with
ResourceLoader, but still preserves any dynamic imports in your userscript. Chunks
will be emitted as ESM modules. You can set the `baseUrl` option to configure a
prefix for where your chunks will be served from.

> [!WARNING]
> Any imports that you use from external deps must be either placed into
> your main entrypoint, or imported using a dynamic import. See below for an exception
> to using static imports.
```js
import mediawikiUserscript from 'vite-plugin-mediawiki-userscript';

export default defineConfig({
	plugins: [
		mediawikiUserscript({
			name: 'my-userscript-name',
			entry: './src/main.ts',

			esmChunks: true,
			baseUrl: `https://tools-static.wmflabs.org/ultraviolet/builds/${process.env.CI_COMMIT_SHA}/`,
		}),
	]
});
```

#### Static imports for side effects
If you have a library (e.g. a web component library) that is only imported for
side effects (i.e. none of its exports are used), you can use static imports, and
dynamically import any part of the chunk before your code that needs it is loaded.

For example, [Ultraviolet](https://gitlab.wikimedia.org/repos/10nm/ultraviolet)
uses the [@material/web](https://github.com/material-components/material-web)
library for components, which are imported as needed in UI code. Ultraviolet
calls `import( '@material/web/button/filled-button' )` as part of its init function,
so that the entire bundle is loaded before and UI code uses it.

This would work:
```vue
<template>
	<md-filled-button @click="counter++">
		{{ counter }}
	</md-filled-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import '@material/web/button/filled-button.js';

const counter = ref( 0 );
</script>
```

This wouldn't:
```vue
<template>
	<MdFilledButton @click="counter++">
		{{ counter }}
	</MdFilledButton>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MdFilledButton from '@material/web/button/filled-button.js';

const counter = ref( 0 );
</script>
```

Make sure to add the chunk name to the `esmUnhoistChunks` option for the plugin.
This will ensure that any hoisted `require()`s that rollup generates will be
removed from the final bundle.

# License
Copyright 2023 Chlod Alejandro

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
“Software”), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
