import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import postcss from "rollup-plugin-postcss";

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;
	
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

const plugins = [
	svelte({
		// enable run-time checks when not in production
		dev: !production,
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css: css => {
			css.write('bundle.css');
		},
		preprocess: sveltePreprocess(),
	}),

	// If you have external dependencies installed from
	// npm, you'll most likely need these plugins. In
	// some cases you'll need additional configuration -
	// consult the documentation for details:
	// https://github.com/rollup/plugins/tree/master/packages/commonjs
	resolve({
		browser: true,
		dedupe: ['svelte']
	}),
	commonjs(),
	postcss({
		extract: false,
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
	//typescript({ sourceMap: !production }),

	// In dev mode, call `npm run start` once
	// the bundle has been generated
	!production && serve(),

	// Watch the `public` directory and refresh the
	// browser on changes when not in production
	!production && livereload('public'),

	// If we're building for production (npm run build
	// instead of npm run dev), minify
	production && terser()
]

export default [
{
	input: 'src/ui/App.svelte',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'PerspectivismUi',
		file: 'public/build/bundle.js'
	},
	plugins,
	watch: {
		clearScreen: false
	}
},
{
	input: 'src/ui/Splash.svelte',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'PerspectivismSplash',
		file: 'public/build/splash.js'
	},
	plugins,
	watch: {
		clearScreen: false
	}
}
]
