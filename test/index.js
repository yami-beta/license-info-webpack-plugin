import assert from 'assert';
import * as Utils from '../src/index';

describe('license-info-webpack-plugin', () => {
  it('getLicenseFileByString()', () => {
    const results = Utils.getLicenseFileByString(`${__dirname}/..`, '{LICENSE,license,License}*');
    assert.equal(results.split(/\n/)[0], 'MIT License');

    const error = Utils.getLicenseFileByString(`${__dirname}/..`, 'license*');
    assert.equal(error, null);
  });

  it('formatPackageInfo()', () => {
    const target = {
      name: 'name',
      version: 'version',
      author: 'author',
      license: 'license',
      maintainers: 'maintainers',
      contributors: 'contributors',
      repository: 'repository',
      pkgPath: 'pkgPath',
      removed: 'removed',
    };
    const results = Utils.formatPackageInfo(target);
    assert.equal(Object.keys(results).length, 8);
    assert.equal(results.removed, undefined);
  });

  it('getPackageJson()', () => {
    const results = Utils.getPackageJson(`${__dirname}/../`);
    assert.equal(results.name, 'license-info-webpack-plugin');
    assert.equal(results.license, 'MIT');
  });

  it('getPackagePath()', () => {
    assert.equal(Utils.getPackagePath('/dev/node_modules/foo/index.js'), '/dev/node_modules/foo');
    assert.equal(Utils.getPackagePath('/dev/node_modules/foo/lib/index.js'), '/dev/node_modules/foo');
    // scoped modules
    assert.equal(Utils.getPackagePath('/dev/node_modules/@user/foo/index.js'), '/dev/node_modules/@user/foo');
  });

  it('filterNodeModules()', () => {
    const modules = [
      { resource: '/dev/node_modules/foo/index.js' },
      { resource: '/dev/index.js' },
      { resource: '/dev/node_modules/foo/node_modules/bar/index.js' },
    ];
    const results = Utils.filterNodeModules(modules);
    assert.equal(results.length, 2);
    assert.equal(results[0], modules[0]);
    assert.equal(results[1], modules[2]);
  });

  /**
   * Generate LICENSE tests
   */
  const withoutLicensePkg = {
    name: 'name',
    version: '1.0.0',
    author: 'author',
    repository: {
      "type": "git",
      "url": "https://github.com/yami-beta/license-info-webpack-plugin",
    },
    maintainers: [
      { name: 'm1', email: 'm1@example.com', url: 'm1.example.com' },
      { name: 'm2', email: 'm2@example.com', url: 'm2.example.com' },
    ],
    contributors: [
      { name: 'c1', email: 'c1@example.com', url: 'c1.example.com' },
      { name: 'c2', email: 'c2@example.com', url: 'c2.example.com' },
    ],
    license: 'MIT',
  };
  const withLicensePkg = {
    name: 'name',
    version: '1.0.0',
    author: 'author',
    repository: {
      "type": "git",
      "url": "https://github.com/yami-beta/license-info-webpack-plugin",
    },
    maintainers: [
      { name: 'm1', email: 'm1@example.com', url: 'm1.example.com' },
      { name: 'm2', email: 'm2@example.com', url: 'm2.example.com' },
    ],
    contributors: [
      { name: 'c1', email: 'c1@example.com', url: 'c1.example.com' },
      { name: 'c2', email: 'c2@example.com', url: 'c2.example.com' },
    ],
    license: 'MIT',
    licenseFile: `MIT License

Copyright (c) 2016 yami_beta

Permission is hereby granted, free of charge, to any person obtaining a copy`,
  };
  it('generateBanner() without license file', () => {
    const pkg = withoutLicensePkg;
    const expected = `/*!
 * name@1.0.0 (MIT)
 *   author: author
 *   url: https://github.com/yami-beta/license-info-webpack-plugin
 *   maintainers:
 *     m1 <m1@example.com> (m1.example.com)
 *     m2 <m2@example.com> (m2.example.com)
 *   contributors:
 *     c1 <c1@example.com> (c1.example.com)
 *     c2 <c2@example.com> (c2.example.com)
 *
 *
 */
`;
    const results = Utils.generateBanner({ [`${pkg.name}@${pkg.version}`]: pkg });
    assert.equal(results, expected);
  });

  it('generateBanner() with license file', () => {
    const pkg = withLicensePkg;
    const expected = `/*!
 * name@1.0.0 (MIT)
 *   author: author
 *   url: https://github.com/yami-beta/license-info-webpack-plugin
 *   maintainers:
 *     m1 <m1@example.com> (m1.example.com)
 *     m2 <m2@example.com> (m2.example.com)
 *   contributors:
 *     c1 <c1@example.com> (c1.example.com)
 *     c2 <c2@example.com> (c2.example.com)
 *
 *   MIT License
 *
 *   Copyright (c) 2016 yami_beta
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *
 *
 */
`;
    const results = Utils.generateBanner({ [`${pkg.name}@${pkg.version}`]: pkg });
    assert.equal(results, expected);
  });

  it('generateHtml() without license file', () => {
    const pkg = withoutLicensePkg;
    const results = Utils.generateHtml({ [`${pkg.name}@${pkg.version}`]: pkg });
    const expected = `
<h3>name@1.0.0 (MIT)</h3>
<dl>
<dt>author</dt>
<dd>author</dd>
<dt>url</dt>
<dd>https://github.com/yami-beta/license-info-webpack-plugin</dd>
<dt>maintainers</dt>
<dd><ul><li>m1 &lt;m1@example.com&gt; (m1.example.com)</li><li>m2 &lt;m2@example.com&gt; (m2.example.com)</li></ul></dd>
<dt>contributors</dt>
<dd><ul><li>c1 &lt;c1@example.com&gt; (c1.example.com)</li><li>c2 &lt;c2@example.com&gt; (c2.example.com)</li></ul></dd>
</dl>
<blockquote>
  <pre></pre>
</blockquote>
`;
    assert.equal(results[0], expected);
  });

  it('generateHtml() with license file', () => {
    const pkg = withLicensePkg;
    const results = Utils.generateHtml({ [`${pkg.name}@${pkg.version}`]: pkg });
    const expected = `
<h3>name@1.0.0 (MIT)</h3>
<dl>
<dt>author</dt>
<dd>author</dd>
<dt>url</dt>
<dd>https://github.com/yami-beta/license-info-webpack-plugin</dd>
<dt>maintainers</dt>
<dd><ul><li>m1 &lt;m1@example.com&gt; (m1.example.com)</li><li>m2 &lt;m2@example.com&gt; (m2.example.com)</li></ul></dd>
<dt>contributors</dt>
<dd><ul><li>c1 &lt;c1@example.com&gt; (c1.example.com)</li><li>c2 &lt;c2@example.com&gt; (c2.example.com)</li></ul></dd>
</dl>
<blockquote>
  <pre>MIT License

Copyright (c) 2016 yami_beta

Permission is hereby granted, free of charge, to any person obtaining a copy</pre>
</blockquote>
`;
    assert.equal(results[0], expected);
  });
});
