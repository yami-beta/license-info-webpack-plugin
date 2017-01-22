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

export function generateBanner(modules) {
  const indent = ' *';
  const banners = modules.map((pkg) => {
    let licenseStr = `${indent}   LICENSE file is not exist`;
    if (pkg.licenseFile) {
      licenseStr = pkg.licenseFile.split(/\n/).map((line) => {
        if (line === '') return indent;
        return `${indent}   ${line}`;
      }).join('\n');
    }

    let author = pkg.author;
    if (typeof author === 'object') {
      author = `${pkg.author.name}${pkg.author.url ? ` (${pkg.author.url})` : ''}`;
    }
    const copyright = `  Copyright (c) ${author}. All rights reserved.`;

    return `${indent} ${pkg.name}@${pkg.version} (${pkg.license})
${indent} ${copyright}
${indent}
${licenseStr}
${indent}
${indent}`;
  });
  return `/**
${banners.join('\n')}
 */
`;
}

export function generateHtml(modules) {
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
      output: 'banner',
      outputPath: './',
    };
    this.opts = Object.assign({}, defaultOptions, options);
    this.basePath = null;
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
            pkgInfo.licenseFile = getLicenseFileByString(pkgPath, this.opts.glob);
            return pkgInfo;
          });

          if (!chunk.isInitial()) return;

          if (this.opts.output === 'html') {
            const filepath = path.join(this.opts.outputPath, `license-${chunk.name}.html`);
            fs.writeFileSync(filepath, generateHtml(pkgList).join('\n'), 'utf-8');
          } else {
            chunk.files.forEach((filename) => {
              compilation.assets[filename] = new ConcatSource(
                generateBanner(pkgList),
                compilation.assets[filename]);
            });
          }
        });

        callback();
      });
    });
  }
}

