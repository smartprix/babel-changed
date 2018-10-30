# babel-changed
A command line tool that only compiles changed files with babel.

### Install

	npm install -g @smpx/babel-changed

### Use
Default source directory is `src` and default out directory is `dist`

	babel-changed

#### See Options & Help

	bebel-changed -h
	
```
Usage: babel-changed [options]

Options:
  -V, --version                output the version number
  -s, --src [dir]              Specify Source Directory (default: "src")
  -d, --dest [dir]             Specify Destination Directory (default: "dist")
  -f, --file-glob [pattern]    Glob pattern to match files in source directory (default: "**/*.*")
  -i, --ignore-glob [pattern]  Glob pattern to match files to ignore (default: "")
  -m, --source-maps [boolean]  Enable source maps (default: true)
  -c, --copy [boolean]         Copy files other than .js files (default: true)
  -h, --help                   output usage information
```

#### Using with options

If your source directory is `source` destination directory is `out` then use

	babel-changed -s source -d out
