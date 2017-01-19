import path from 'path';
import fs from 'fs';
import glob from 'glob';
import { ConcatSource } from 'webpack-sources';

export function getLicenseFileByString(pkgPath, licenseFileGlob) {
  const licenseFiles = glob.sync(path.join(pkgPath, licenseFileGlob));
  let licenseFile = null;
  if (licenseFiles.length > 0) {
    licenseFile = fs.readFileSync(licenseFiles[0], 'utf-8');
  }
  return licenseFile;
}

export function formatPackageInfo(pkg) {
  return {
    name: pkg.name,
    version: pkg.version,
    author: pkg.author,
    license: pkg.license || pkg.licenses,
    maintainers: pkg.maintainers,
    contributors: pkg.contributors,
    pkgPath: pkg.pkgPath,
  };
}

export function getPackageJson(packagePath) {
  const jsonPath = path.join(packagePath, 'package.json');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

export function getPackagePath(modulePath) {
  return path.dirname(modulePath);
}

export function filterNodeModules(modules) {
  return modules.filter(mod => mod.resource.includes('node_modules'));
}

export function wrapComment(lines) {
  const indent = '   ';
  return `/*!\n${lines.map(line => `${indent}${line}`).join('\n')}\n */\n`;
}

export function generateBanner(modules) {
  const banners = modules.map((pkg) => {
    let licenseAry = [];
    if (pkg.licenseFile) {
      licenseAry = pkg.licenseFile.split(/\n/).map(line => `  ${line}`);
    } else {
      licenseAry = ['  LICENSE file is not exist'];
    }

    let author = pkg.author;
    if (typeof author === 'object') {
      author = `${pkg.author.name}${pkg.author.url ? ` (${pkg.author.url})` : ''}`;
    }
    const copyright = `  Copyright (c) ${author}. All rights reserved.`;

    let banner = [
      `${pkg.name}@${pkg.version} (${pkg.license})`,
      '',
      `${copyright}`,
      '',
    ];
    banner = banner.concat(licenseAry);
    banner = banner.concat(['', '']);
    return banner;
  });
  return wrapComment(banners.reduce((a, b) => a.concat(b)));
}

export default class LicensePack {
  constructor(options) {
    const opts = options || {};
    this.basePath = null;
    this.licenseFileGlob = opts.glob || '{LICENSE,license,License}*';
  }

  apply(compiler) {
    this.basePath = path.join(compiler.context, 'node_modules');

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        chunks.forEach((chunk) => {
          const modules = filterNodeModules(chunk.modules);
          const pkgList = modules.map((mod) => {
            const pkgPath = getPackagePath(mod.resource);
            const pkg = getPackageJson(pkgPath);
            pkg.pkgPath = pkgPath;
            const pkgInfo = formatPackageInfo(pkg);
            pkgInfo.licenseFile = getLicenseFileByString(pkgPath, this.licenseFileGlob);
            return pkgInfo;
          });

          if (!chunk.isInitial()) return;
          chunk.files.forEach((filename) => {
            compilation.assets[filename] = new ConcatSource(
              generateBanner(pkgList),
              compilation.assets[filename]);
          });
        });

        callback();
      });
    });
  }
}

