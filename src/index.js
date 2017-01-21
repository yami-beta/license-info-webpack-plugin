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
  const modulePathAry = modulePath.split(path.sep);
  // ['', 'dev', 'node_modules', 'foo', 'node_modules', 'bar', 'lib', 'index.js']
  //                                     |
  //                                     `-- lastNodeModulesIndex
  const lastNodeModulesIndex = modulePathAry.lastIndexOf('node_modules');
  let pkgDirIndexfromNodeModules = 2;
  if (modulePathAry[lastNodeModulesIndex + 1].startsWith('@')) {
    // check scoped modules
    pkgDirIndexfromNodeModules += 1;
  }
  const pkgPathAry = modulePathAry.slice(0, lastNodeModulesIndex + pkgDirIndexfromNodeModules);
  return pkgPathAry.join(path.sep);
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
  return banners;
}

export function generateHtml(modules, filepath) {
  const banners = generateBanner(modules);
  const licenseFileIndex = 4;
  const htmlAry = modules.map((pkg) => {
    let licenseStr = '';
    if (pkg.licenseFile) {
      licenseStr = pkg.licenseFile;
    } else {
      licenseStr = 'LICENSE file is not exist';
    }

    let author = pkg.author;
    if (typeof author === 'object') {
      author = `${pkg.author.name}${pkg.author.url ? ` (${pkg.author.url})` : ''}`;
    }
    const copyright = `Copyright (c) ${author}. All rights reserved.`;

    return `
<h3>${pkg.name}@${pkg.version} (${pkg.license})</h3>
<p>${copyright}</p>
<blockquote>
  <pre>${licenseStr}</pre>
</blockquote>
`;
  });
  return htmlAry;
}

export default class LicensePack {
  constructor(options) {
    const defaultOptions = {
      glob: '{LICENSE,license,License}*',
      outputFile: false,
    };
    const opts = Object.assign({}, defaultOptions, options);
    this.basePath = null;
    this.licenseFileGlob = opts.glob;
    this.outputFile = opts.outputFile;
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

          if (this.outputFile) {
            console.log(generateHtml(pkgList).join("\n"));
          } else {
            chunk.files.forEach((filename) => {
              const banner = generateBanner(pkgList);
              compilation.assets[filename] = new ConcatSource(
                wrapComment(banner.reduce((a, b) => a.concat(b))),
                compilation.assets[filename]);
            });
          }
        });

        callback();
      });
    });
  }
}

