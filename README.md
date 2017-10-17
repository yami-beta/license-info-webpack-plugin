# license-pack

[![npm version](https://badge.fury.io/js/license-pack.svg)](https://www.npmjs.com/package/license-pack)

**`license-pack` is renamed to `license-info-webpack-plugin`**

`license-pack` is a webpack plugin for making a list of package's LICENSE information, inspired by [licensify](https://github.com/twada/licensify).

```sh
$ npm install --save-dev license-pack
```

```sh
$ yarn add --dev license-pack
```

## Usage

```js
const LicensePack = require('license-pack').default;

module.exports = {
  entry: './src/js/index.js',
  output: {
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].js'
  },
  plugins: [
    new LicensePack({
      glob: '{LICENSE,license,License}*'
    })
  ]
};
```

Note: `license-pack` needs `webpack v3.0 or above`

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
