const util = require('util');
const babel = require('@babel/core');
const {File, Vachan} = require('sm-utils');

let logger = console;

async function transform({
	srcDir = 'src',
	filesGlobPattern = '**/*.*',
	destDir = 'dist',
	copyOthers = true,
	sourceMaps = true,
} = {}) {
	logger.time('babel-changed');
	const srcFiles = await File(`${srcDir}/${filesGlobPattern}`).glob();
	const destFiles = await File(`${destDir}/${filesGlobPattern}`).glob();

	const filesToCompile = [];
	const filesToCopy = [];
	const filesToRemove = [];

	await Vachan.map(srcFiles, async (srcFile) => {
		const mtimeSrc = await File(srcFile).mtime();
		const destFile = `${destDir}${srcFile.substring(srcDir.length)}`;
		const mtimeDest = await File(destFile).mtime();
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
			await File(dest).mkdirpPath();
			await File(src).copy(dest);
		});
	}

	if (filesToRemove.length) {
		logger.log(`[babel] removing ${filesToRemove.length} files`);
		await Vachan.map(filesToRemove, async (destFile) => {
			await File(destFile).rm();
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
		await File(destFile).write(result.code);
		
		if (result.map && sourceMaps) {
			result.map.sources = [`${process.cwd()}/${srcFile}`]
			await File(`${destFile}.map`).write(JSON.stringify(result.map));
		}
	}, {concurrency: 5});

	logger.timeEnd('babel-changed');
}

module.exports = {
	transform,
}