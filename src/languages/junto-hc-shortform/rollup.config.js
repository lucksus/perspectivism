import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
//import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import postcss from "rollup-plugin-postcss";
import { string } from 'rollup-plugin-string'
import json from '@rollup/plugin-json';
import fs from 'fs';

const production = !process.env.ROLLUP_WATCH;

// Holochain DNA Rollup loader function
// Checks if filename ends with .dna.gz and then loads it as base64 string
function dna() {
	return {
	  name: 'dna',
	  load: function load(id) {
		if(!id.endsWith(".dna.gz"))
			return null
		var base64 = fs.readFileSync(id, "base64").replace(/[\r\n]+/gm, '');
		var code = `var dna = "${base64}"; \nexport default dna;` 
		return code.trim();
	  }
	};
  }

export default {
	input: 'index.js',
	external: ["aws-sdk"],
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'JuntoShortForm',
		file: 'build/bundle.js'
	},
	plugins: [
		string({
			include: 'build/*.js'
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			//css: css => {
			//	css.write('bundle.css');
			//},
			preprocess: sveltePreprocess(),
		}),
		// copy({
        //     assets: ['package.unbundled.json']
        // }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs({
			dynamicRequireTargets: [
				'./node_modules/blake2b'
			]
		}),
		postcss({
			extract: true,
			minimize: true,
			use: [
			  ['sass', {
				includePaths: [
				  './src/ui/theme',
				  './node_modules'
				]
			  }]
			]
		  }),
		json(),
		dna()
	],
	watch: {
		clearScreen: false
	}
}
