/* eslint-env node */
require( '@rushstack/eslint-patch/modern-module-resolution' );

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	env: {
		node: true
	},
	extends: [
		'plugin:@typescript-eslint/recommended',
		'eslint:recommended',
		'wikimedia/common'
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/ban-types': 'off',
		'jsdoc/require-returns-type': 'off',
		'jsdoc/require-param-type': 'off'
	},
	ignorePatterns: [ 'assets/*' ]
};
