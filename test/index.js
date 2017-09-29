import assert from 'assert';
import * as Utils from '../src/index';

describe('license-pack', () => {
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
      pkgPath: 'pkgPath',
      removed: 'removed',
    };
    const results = Utils.formatPackageInfo(target);
    assert.equal(Object.keys(results).length, 7);
    assert.equal(results.removed, undefined);
  });

  it('getPackageJson()', () => {
    const results = Utils.getPackageJson(`${__dirname}/../`);
    assert.equal(results.name, 'license-pack');
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

  it('generateBanner() without license file', () => {
    const pkg = {
      name: 'name',
      version: '1.0.0',
      author: 'author',
      license: 'MIT',
    };
    const expected = `/*!
 * name@1.0.0 (MIT)
 *   Copyright (c) author. All rights reserved.
 *
 *
 *
 *
 */
`;
    const results = Utils.generateBanner([pkg]);
    assert.equal(results, expected);
  });

  it('generateBanner() with license file', () => {
    const pkg = {
      name: 'name',
      version: '1.0.0',
      author: 'author',
      license: 'MIT',
      licenseFile: `MIT License

Copyright (c) 2016 yami_beta

Permission is hereby granted, free of charge, to any person obtaining a copy`,
    };
    const expected = `/*!
 * name@1.0.0 (MIT)
 *   Copyright (c) author. All rights reserved.
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
    const results = Utils.generateBanner([pkg]);
    assert.equal(results, expected);
  });

  it('generateHtml() without license file', () => {
    const pkg = {
      name: 'name',
      version: '1.0.0',
      author: 'author',
      license: 'MIT',
    };
    const results = Utils.generateHtml([pkg]);
    const expected = `
<h3>name@1.0.0 (MIT)</h3>
<p>Copyright (c) author. All rights reserved.</p>
<blockquote>
  <pre></pre>
</blockquote>
`;
    assert.equal(results[0], expected);
  });

  it('generateHtml() with license file', () => {
    const pkg = {
      name: 'name',
      version: '1.0.0',
      author: 'author',
      license: 'MIT',
      licenseFile: `MIT License

Copyright (c) 2016 yami_beta

Permission is hereby granted, free of charge, to any person obtaining a copy`,
    };
    const results = Utils.generateHtml([pkg]);
    const expected = `
<h3>name@1.0.0 (MIT)</h3>
<p>Copyright (c) author. All rights reserved.</p>
<blockquote>
  <pre>MIT License

Copyright (c) 2016 yami_beta

Permission is hereby granted, free of charge, to any person obtaining a copy</pre>
</blockquote>
`;
    assert.equal(results[0], expected);
  });
});
