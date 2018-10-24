#! /usr/bin/env node
const program = require('commander');
const {version} = require('../package.json');
const {transform} = require('../index');

program
	.version(version)
	.option('-d, --dest [dir]', 'Specify Destination Directory', 'dist')
	.option('-s, --src [dir]', 'Specify Source Directory', 'src')
	.option('-f, --file-glob [pattern]', 'Glob pattern to match files in source directory', '**/*.*')
	.option('-m, --source-maps [boolean]', 'Enable source maps', true)
	.option('-c, --copy [boolean]', 'Copy files other than .js files', true)
	.parse(process.argv);

const options = {
	srcDir: program.src,
	filesGlobPattern: program.fileGlob,
	destDir: program.dest,
	copyOthers: program.copy !== 'false',
	sourceMaps: program.sourceMaps !== 'false',
};

async function runAndExit() {
	try {
		await transform(options);
		process.exit(0);
	}
	catch(err) {
		console.error(err);
		process.exit(1);
	}
}

runAndExit();