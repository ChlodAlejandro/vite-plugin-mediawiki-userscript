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
