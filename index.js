const babel = require('@babel/core');
const path = require('path');
const fs = require('fs').promises;
const fastGlob = require('fast-glob');
const pMap = require('p-map');

function getLogger() {
	let logger = console;
	try {
		// eslint-disable-next-line global-require
		const {Oak} = require('@smpx/oak');
		logger = new Oak('babel-changed');
	}
	catch (err) {
		logger = console;
	}
	return logger;
}

async function mtime(file) {
	try {
		return (await fs.lstat(file)).mtime;
	}
	catch (e) {
		return 0;
	}
}

async function mkdirp(file) {
	return fs.mkdir(path.dirname(file), {recursive: true, mode: 0o755});
}

async function write(file, contents) {
	return fs.writeFile(file, contents, {encoding: 'utf8', mode: 0o644});
}

const logger = getLogger();

async function transform({
	srcDir = 'src',
	filesGlobPattern = '**/*.*',
	destDir = 'dist',
	extensions = ['.js'],
	copyOthers = true,
	sourceMaps = true,
	ignoredGlobPattern = '**/node_modules/**',
	verbose = true,
} = {}) {
	// convert srcDir & destDir to absolute path
	srcDir = path.resolve(srcDir);
	destDir = path.resolve(destDir);

	const ignorePattern = [];
	if (destDir.startsWith(`${srcDir}/`)) {
		// destDir is inside srcDir, ignore destDir files
		ignorePattern.push(`${destDir}/**`);
	}
	if (ignoredGlobPattern) {
		ignorePattern.push(ignoredGlobPattern);
	}

	if (verbose) {
		logger.time('babel-changed');
	}
	const srcFiles = await fastGlob(filesGlobPattern, {
		cwd: srcDir,
		ignore: ignorePattern,
		absolute: true,
	});
	const destFiles = await fastGlob(filesGlobPattern, {
		cwd: destDir,
		absolute: true,
	});

	const filesToCompile = [];
	const filesToCopy = [];
	const filesToRemove = [];

	// Filter source files between files to copy or compile
	await pMap(srcFiles, async (srcFile) => {
		const mtimeSrc = await mtime(srcFile);
		const destFile = `${destDir}/${srcFile.substring(srcDir.length + 1)}`;
		const mtimeDest = await mtime(destFile);
		if (mtimeDest < mtimeSrc) {
			if (extensions.some((extension) => srcFile.endsWith(extension))) {
				filesToCompile.push(srcFile);
			}
			else if (copyOthers) {
				filesToCopy.push([srcFile, destFile]);
			}
		}
	});

	destFiles.forEach((destFile) => {
		// ignore map files
		if (destFile.endsWith('.map')) return;

		const srcFile = `${srcDir}/${destFile.substring(destDir.length + 1)}`;
		if (!srcFiles.includes(srcFile)) {
			filesToRemove.push(destFile);
			if (destFile.endsWith('.js')) {
				filesToRemove.push(`${destFile}.map`);
			}
		}
	});

	if (filesToCopy.length) {
		if (verbose) {
			logger.log(`[babel] copying ${filesToCopy.length} files`);
		}
		await pMap(filesToCopy, async ([src, dest]) => {
			await mkdirp(dest);
			await fs.copyFile(src, dest);
		});
	}

	if (filesToRemove.length) {
		if (verbose) {
			logger.log(`[babel] removing ${filesToRemove.length} files`);
		}
		await pMap(filesToRemove, async (destFile) => {
			await fs.unlink(destFile).catch((err) => {
				logger.warn('[babel] A file could not be removed,', destFile, err.message);
			});
		});
	}

	if (!filesToCompile.length) {
		if (verbose) {
			logger.log('[babel] nothing to compile');
			logger.timeEnd('babel-changed');
		}
		return;
	}

	if (verbose) {
		logger.log(`[babel] compiling ${filesToCompile.length} files`);
	}

	const options = {
		sourceMaps,
	};

	await pMap(filesToCompile, async (srcFile) => {
		let destFile = `${destDir}/${srcFile.substring(srcDir.length + 1)}`;
		destFile = `${destFile.slice(0, destFile.length - path.extname(destFile).length)}.js`;
		const result = await babel.transformFileAsync(srcFile, options);

		if (sourceMaps) {
			result.code += `\n//# sourceMappingURL=${destFile}.map`;
		}

		await mkdirp(destFile);
		await write(destFile, result.code);

		if (result.map && sourceMaps) {
			result.map.sources = [srcFile];
			await write(`${destFile}.map`, JSON.stringify(result.map));
		}
	}, {concurrency: 5});

	if (verbose) {
		logger.timeEnd('babel-changed');
	}
}

module.exports = {
	transform,
	logger,
}