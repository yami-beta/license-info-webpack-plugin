# license-pack

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

new LicensePack({
  glob: '{LICENSE,license,License}*'
})
```

### Options

- `glob`
    - glob pattern for LICENSE file
    - default: `'{LICENSE,license,License}*'`

# LICENSE

MIT
