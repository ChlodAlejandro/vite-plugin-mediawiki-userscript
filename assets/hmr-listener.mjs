// https://vitejs.dev/guide/api-plugin.html#server-to-client
if ( import.meta.hot ) {
    console.log("[vite:mediawiki-userscript] registering...");
    import.meta.hot.on('mediawiki-userscript:getExports', ( { modules, requestId }) => {
        mw.loader.using( modules, (require) => {
            /** @type {Record<string, string[]>} */
            const exportMap = {};

            for ( const exportName of modules ) {
                exportMap[exportName] = Object.keys(require(exportName));
            }

            import.meta.hot.send('mediawiki-userscript:exports', {
                requestId,
                exportMap
            });
        });
    });
    console.log("[vite:mediawiki-userscript] loader registered");
}
