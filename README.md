# babel-changed

[![Version](https://img.shields.io/npm/v/@smpx/babel-changed.svg)](https://www.npmjs.com/package/@smpx/babel-changed)
[![Downloads](https://img.shields.io/npm/dm/@smpx/babel-changed.svg)](https://www.npmjs.com/package/@smpx/babel-changed)
[![License](https://img.shields.io/npm/l/@smpx/babel-changed.svg)](https://www.npmjs.com/package/@smpx/babel-changed)
[![Dependencies](https://david-dm.org/smartprix/babel-changed/status.svg)](https://david-dm.org/smartprix/babel-changed)
[![Dev Dependencies](https://david-dm.org/smartprix/babel-changed/dev-status.svg)](https://david-dm.org/smartprix/babel-changed?type=dev)

A command line tool that only compiles changed files with babel.

## Install

Globally:

```sh
npm install -g @smpx/babel-changed
# OR
yarn global add @smpx/babel-changed
```

Or locally:

```sh
npm install @smpx/babel-changed --save-dev
# OR
yarn add @smpx/babel-changed --dev
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
  -f, --file-glob [pattern]    Glob pattern to match files in source directory (default: "**/*.*" (all files))
  -i, --ignore-glob [pattern]  Glob pattern to match files to ignore
                               (default: "**/node_modules/**" (ignore all files inside node_modules))
  -e, --extensions <exts>      Extensions to compile (comma separated) (default: ".js")
  -m, --source-maps [boolean]  Enable source maps (default: true)
  -c, --copy [boolean]         Copy files other than .js files (default: true)
  -h, --help                   output usage information
```

### Using with options

If your source directory is `source` destination directory is `out` then use

```sh
babel-changed -s source -d out
```

### Extensions/Typescript support

For compiling TS/JSX files with babel, change the extensions to compile like below:

```sh
babel-changed -e ".js,.ts"
```

**NOTE**: Extension of compiled file will always be `.js`.
