import { build } from 'vite';
import { readdirSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';

const ROOT    = resolve(import.meta.dirname, '..');
const SRC_DIR = join(ROOT, 'src/client-extensions');
const DIST_DIR = join(ROOT, 'dist/builds');

function discoverExtensions() {
	if (!existsSync(SRC_DIR)) return [];
	return readdirSync(SRC_DIR).filter((name) => {
		const entry = join(SRC_DIR, name, 'index.js');
		return existsSync(entry) && statSync(join(SRC_DIR, name)).isDirectory();
	});
}

// 'gsap-animations' → 'gsapAnimations'  (IIFE name must be a valid JS identifier)
function toCamelCase(str) {
	return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

async function buildExtension(name) {
	const entry  = join(SRC_DIR, name, 'index.js');
	const outDir = join(DIST_DIR, name);

	console.log(`\nBuilding: ${name}`);

	await build({
		configFile: false,
		root: ROOT,
		publicDir: false,
		build: {
			outDir,
			emptyOutDir: true,
			lib: {
				entry,
				formats: ['iife'],
				name: toCamelCase(name),
				fileName: () => `${name}.js`,
			},
			rollupOptions: {
				output: {
					assetFileNames: `${name}.[ext]`,
				},
			},
		},
	});

	console.log(`  -> dist/builds/${name}/${name}.js`);
	if (existsSync(join(outDir, `${name}.css`))) {
		console.log(`  -> dist/builds/${name}/${name}.css`);
	}
}

async function main() {
	const target = process.argv[2];
	const extensions = discoverExtensions();

	if (extensions.length === 0) {
		console.error('No extensions found in src/client-extensions/');
		process.exit(1);
	}

	const toRun = target ? [target] : extensions;
	const missing = toRun.filter((n) => !extensions.includes(n));
	if (missing.length) {
		console.error(`Extension not found: ${missing.join(', ')}`);
		console.error(`Available: ${extensions.join(', ')}`);
		process.exit(1);
	}

	const failed = [];
	for (const name of toRun) {
		try {
			await buildExtension(name);
		} catch (err) {
			console.error(`\nFailed to build "${name}":`, err.message);
			failed.push(name);
		}
	}

	if (failed.length) {
		console.error(`\nFailed extensions: ${failed.join(', ')}`);
		process.exit(1);
	}

	console.log('\nAll extensions built successfully.');
}

main();
