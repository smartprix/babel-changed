#! /usr/bin/env node
const program = require('commander');
const {version} = require('../package.json');
const {transform, logger} = require('../index');

program
	.version(version)
	.option('-s, --src [dir]', 'Specify Source Directory', 'src')
	.option('-d, --dest [dir]', 'Specify Destination Directory', 'dist')
	.option('-f, --file-glob [pattern]', 'Glob pattern to match files in source directory', '**/*.*')
	.option('-i, --ignore-glob [pattern]', 'Glob pattern to match files to ignore', '**/node_modules/**')
	.option('-e, --extensions <exts>', 'Extensions to compile (comma separated)', '.js')
	.option('-m, --source-maps [boolean]', 'Enable source maps', true)
	.option('-c, --copy [boolean]', 'Copy files other than .js files', true)
	.option('-v, --verbose [boolean]', 'Logs info about executed file operations', true)
	.parse(process.argv);

const options = {
	srcDir: program.src,
	destDir: program.dest,
	filesGlobPattern: program.fileGlob,
	ignoredGlobPattern: program.ignoreGlob,
	extensions: program.extensions.split(',').map(s => s.trim()).filter(Boolean),
	sourceMaps: program.sourceMaps !== 'false',
	copyOthers: program.copy !== 'false',
	verbose: program.verbose !== 'false',
};

async function runAndExit() {
	try {
		await transform(options);
		process.exit(0);
	}
	catch(err) {
		logger.error('Error while transpiling files', err);
		process.exit(1);
	}
}

runAndExit();