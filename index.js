const util = require('util');
const babel = require('@babel/core');
const {file, Vachan} = require('sm-utils');

let logger = console;

async function transform({
	srcDir = 'src',
	filesGlobPattern = '**/*.*',
	destDir = 'dist',
	copyOthers = true,
	sourceMaps = true,
	ignoredGlobPattern = '',
} = {}) {
	logger.time('babel-changed');
	const srcFiles = await file(`${srcDir}/${filesGlobPattern}`).glob();
	const destFiles = await file(`${destDir}/${filesGlobPattern}`).glob();
	const ignoredFiles = ignoredGlobPattern !== '' ? await file(`${srcDir}/${ignoredGlobPattern}`).glob() : [];
	
	const filesToCompile = [];
	const filesToCopy = [];
	const filesToRemove = [];

	// Filter source files between files to copy or compile
	await Vachan.map(srcFiles, async (srcFile) => {
		if (ignoredFiles.includes(srcFile)) return;

		const mtimeSrc = await file(srcFile).mtime();
		const destFile = `${destDir}${srcFile.substring(srcDir.length)}`;
		const mtimeDest = await file(destFile).mtime();
		if (mtimeDest < mtimeSrc) {
			if (srcFile.endsWith('.js')) {
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
		await Vachan.map(filesToCopy, async ([src, dest]) => {
			await file(dest).mkdirpPath();
			await file(src).copy(dest);
		});
	}

	if (filesToRemove.length) {
		logger.log(`[babel] removing ${filesToRemove.length} files`);
		await Vachan.map(filesToRemove, async (destFile) => {
			await file(destFile).rm();
		});
	}

	if (!filesToCompile.length) {
		logger.log('[babel] nothing to compile');
		logger.timeEnd('babel-changed');
		return;
	}

	const transformFile = util.promisify(babel.transformFile);
	logger.log(`[babel] compiling ${filesToCompile.length} files`);


	const options = {
		sourceMaps,
	};

	await Vachan.map(filesToCompile, async (srcFile) => {
		const destFile = `${destDir}${srcFile.substring(srcDir.length)}`;
		const result = await transformFile(srcFile, options);

		if (sourceMaps) {
			result.code += `\n//# sourceMappingURL=${process.cwd()}/${destFile}.map`
		}
		await file(destFile).write(result.code);
		
		if (result.map && sourceMaps) {
			result.map.sources = [`${process.cwd()}/${srcFile}`]
			await file(`${destFile}.map`).write(JSON.stringify(result.map));
		}
	}, {concurrency: 5});

	logger.timeEnd('babel-changed');
}

module.exports = {
	transform,
}