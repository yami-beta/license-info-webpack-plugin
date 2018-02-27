# license-info-webpack-plugin

[![npm version](https://badge.fury.io/js/license-info-webpack-plugin.svg)](https://www.npmjs.com/package/license-info-webpack-plugin)
[![Build Status](https://travis-ci.org/yami-beta/license-info-webpack-plugin.svg?branch=master)](https://travis-ci.org/yami-beta/license-info-webpack-plugin)

`license-info-webpack-plugin` is a webpack plugin for making a list of package's LICENSE information, inspired by [licensify](https://github.com/twada/licensify).

```sh
$ npm install --save-dev license-info-webpack-plugin
```

```sh
$ yarn add --dev license-info-webpack-plugin
```

## Usage

```js
const LicenseInfoWebpackPlugin = require('license-info-webpack-plugin').default;

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js'
  },
  plugins: [
    new LicenseInfoWebpackPlugin({
      glob: '{LICENSE,license,License}*'
    })
  ]
};
```

Note: `license-info-webpack-plugin` needs `webpack v3.0 or above`

### Options

- `glob`
    - Glob pattern for LICENSE file
    - Default: `'{LICENSE,license,License}*'`
- `output`
    - Output type: `'banner'` or `'html'`
        - `'banner'`: Append comment to top of bundled code
        - `'html'`: Generate html
    - Default: `'banner'`
- `outputPath`
    - Output path for generated html
    - If `outputPath` is `'./'`, `./license-[name].html` are generated
    - This option is enabled if `output: 'html'` is set.
    - Default: `'./'`
- `includeLicenseFile`
    - Include and put LICENSE file
    - Default: `true`

# LICENSE

MIT
