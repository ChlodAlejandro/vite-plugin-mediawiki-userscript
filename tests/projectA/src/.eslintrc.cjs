module.exports = {
    extends: [
        "../.eslintrc.cjs",
        "wikimedia/client/es6",
        "wikimedia/mediawiki",
        "wikimedia/vue3/es6"
    ],
    rules: {
        // Transpilation by TypeScript takes care of this.
        "es-x/no-optional-chaining": "off",

        // https://www.mediawiki.org/wiki/Manual:Coding_conventions/Vue#Template
        "vue/component-name-in-template-casing": "off"
    }
}
