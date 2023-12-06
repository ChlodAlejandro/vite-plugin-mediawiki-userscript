/* eslint-env node */

/** @type {import('eslint')} */
module.exports = {
	root: true,
	'extends': [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'@vue/eslint-config-typescript',
		'wikimedia/common'
	],
	parserOptions: {
		ecmaVersion: 'latest'
	},
	ignorePatterns: [
		'env.d.ts'
	]
};
