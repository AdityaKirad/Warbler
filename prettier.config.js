/** @type {import("prettier").Config} */

const config = {
	plugins: [
		"@ianvs/prettier-plugin-sort-imports",
		"prettier-plugin-tailwindcss",
	],
	bracketSameLine: true,
	printWidth: 120,
	tabWidth: 2,
	tailwindFunctions: ["cn"],
};

export default config;
