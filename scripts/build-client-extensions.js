import { build } from 'vite';
import { readdirSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';

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

export async function buildExtensions (target) {
	const extensions = discoverExtensions();

	if (extensions.length === 0) {
		throw new Error('No extensions found in src/client-extensions/');
	}

	const toRun = target ? [target] : extensions;
	const missing = toRun.filter((n) => !extensions.includes(n));
	if (missing.length) {
		throw new Error(
			`Extension not found: ${missing.join(', ')}. Available: ${extensions.join(', ')}`,
		);
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
		throw new Error(`Failed extensions: ${failed.join(', ')}`);
	}

	console.log('\nAll extensions built successfully.');
}

// Auto-ejecución solo cuando el archivo se invoca directamente:
//   node scripts/build-client-extensions.js [nombre]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	buildExtensions(process.argv[2]).catch((err) => {
		console.error(err.message);
		process.exit(1);
	});
}
