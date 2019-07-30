# babel-changed

<a href="https://www.npmjs.com/package/@smpx/babel-changed"><img src="https://img.shields.io/npm/v/@smpx/babel-changed.svg" alt="Version"></a>
<a href="https://www.npmjs.com/package/@smpx/babel-changed"><img src="https://img.shields.io/npm/dm/@smpx/babel-changed.svg" alt="Downloads"></a>
<a href="https://www.npmjs.com/package/@smpx/babel-changed"><img src="https://img.shields.io/npm/l/@smpx/babel-changed.svg" alt="License"></a>
<a href="https://david-dm.org/smartprix/babel-changed"><img src="https://david-dm.org/smartprix/babel-changed/status.svg" alt="Dependencies"></a>
<a href="https://david-dm.org/smartprix/babel-changed?type=dev"><img src="https://david-dm.org/smartprix/babel-changed/dev-status.svg" alt="Dev Dependencies"></a>

A command line tool that only compiles changed files with babel.

## Install

Globally:

```sh
npm install -g @smpx/babel-changed
```

Or locally:

```sh
npm install @smpx/babel-changed --only=dev
```

## Use

Default source directory is `src` and default out directory is `dist`

```sh
babel-changed
# Output
[babel] compiling 1 files
babel-changed: 1413.925ms
```

### See Options & Help

```sh
bebel-changed -h

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

### Using with options

If your source directory is `source` destination directory is `out` then use

```sh
babel-changed -s source -d out
```
