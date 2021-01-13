const babel = require('@babel/core');
const path = require('path');
const fs = require('fs').promises;
const nodeGlob = require('glob');
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

async function glob(pattern) {
	return new Promise((resolve, reject) => {
		nodeGlob(pattern, (err, files) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(files);
			}
		});
	});
}

function removeSlash(dir) {
	return dir.endsWith('/') ? dir.substring(0, dir.length - 1) : dir;
}

const logger = getLogger();

async function transform({
	srcDir = 'src',
	filesGlobPattern = '{,!(node_modules)/**/}*.*',
	destDir = 'dist',
	extensions = ['.js'],
	copyOthers = true,
	sourceMaps = true,
	ignoredGlobPattern = '',
} = {}) {
	// remove slashes from the end of paths given
	srcDir = removeSlash(srcDir);
	destDir = removeSlash(destDir);

	logger.time('babel-changed');
	const srcFiles = await glob(`${srcDir}/${filesGlobPattern}`);
	const destFiles = await glob(`${destDir}/${filesGlobPattern}`);
	const ignoredFiles = ignoredGlobPattern !== '' ? await glob(`${srcDir}/${ignoredGlobPattern}`) : [];

	const filesToCompile = [];
	const filesToCopy = [];
	const filesToRemove = [];

	// Filter source files between files to copy or compile
	await pMap(srcFiles, async (srcFile) => {
		if (ignoredFiles.includes(srcFile)) return;

		const mtimeSrc = await mtime(srcFile);
		const destFile = `${destDir}${srcFile.substring(srcDir.length)}`;
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

		const srcFile = `${srcDir}${destFile.substring(destDir.length)}`;
		if (!srcFiles.includes(srcFile)) {
			filesToRemove.push(destFile);
			if (destFile.endsWith('.js')) {
				filesToRemove.push(`${destFile}.map`);
			}
		}
	});

	if (filesToCopy.length) {
		logger.log(`[babel] copying ${filesToCopy.length} files`);
		await pMap(filesToCopy, async ([src, dest]) => {
			await mkdirp(dest);
			await fs.copyFile(src, dest);
		});
	}

	if (filesToRemove.length) {
		logger.log(`[babel] removing ${filesToRemove.length} files`);
		await pMap(filesToRemove, async (destFile) => {
			await fs.unlink(destFile).catch((err) => {
				logger.warn('[babel] A file could not be removed,', destFile, err.message)
			});
		});
	}

	if (!filesToCompile.length) {
		logger.log('[babel] nothing to compile');
		logger.timeEnd('babel-changed');
		return;
	}

	logger.log(`[babel] compiling ${filesToCompile.length} files`);

	const options = {
		sourceMaps,
	};

	await pMap(filesToCompile, async (srcFile) => {
		let destFile = `${destDir}${srcFile.substring(srcDir.length)}`;
		destFile = `${destFile.slice(0, destFile.length - path.extname(destFile).length)}.js`;
		const result = await babel.transformFileAsync(srcFile, options);

		if (sourceMaps) {
			result.code += `\n//# sourceMappingURL=${process.cwd()}/${destFile}.map`
		}

		await mkdirp(destFile);
		await write(destFile, result.code);

		if (result.map && sourceMaps) {
			result.map.sources = [`${process.cwd()}/${srcFile}`]
			await write(`${destFile}.map`, JSON.stringify(result.map));
		}
	}, {concurrency: 5});

	logger.timeEnd('babel-changed');
}

module.exports = {
	transform,
	logger,
}