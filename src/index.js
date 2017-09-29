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
  return modules.filter(mod => {
    if (!mod.resource) return false;
    return mod.resource.includes('node_modules')
  });
}

export function generateBanner(modules) {
  const indent = ' *';
  const banners = Object.keys(modules).map((pkgId) => {
    const pkg = modules[pkgId];
    let licenseStr = `${indent}`;
    if (pkg.licenseFile) {
      licenseStr = `${indent}\n`;
      licenseStr += pkg.licenseFile.split(/\n/).map((line) => {
        if (line === '') return indent;
        return `${indent}   ${line}`;
      }).join('\n');
      licenseStr += `\n${indent}`;
    } else {
      licenseStr = `${indent}`;
    }

    let author = pkg.author;
    if (typeof author === 'object') {
      author = `${pkg.author.name}${pkg.author.url ? ` (${pkg.author.url})` : ''}`;
    }
    const copyright = `  Copyright (c) ${author}. All rights reserved.`;

    return `${indent} ${pkg.name}@${pkg.version} (${pkg.license})
${indent} ${copyright}
${licenseStr}
${indent}`;
  });
  return `/*!
${banners.join('\n')}
 */
`;
}

export function generateHtml(modules) {
  const htmlAry = Object.keys(modules).map((pkgId) => {
    const pkg = modules[pkgId];
    let licenseStr = '';
    if (pkg.licenseFile) {
      licenseStr = pkg.licenseFile;
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
      includeLicenseFile: true,
    };
    this.opts = Object.assign({}, defaultOptions, options);
    this.basePath = null;
  }

  apply(compiler) {
    this.basePath = path.join(compiler.context, 'node_modules');

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
        chunks.forEach((chunk) => {
          // chunk.modules are deprecated from webpack v3.x
          const modules = filterNodeModules(chunk.mapModules(mod => mod));
          const pkgList = modules.map((mod) => {
            const pkgPath = getPackagePath(mod.resource);
            const pkg = getPackageJson(pkgPath);
            pkg.pkgPath = pkgPath;
            const pkgInfo = formatPackageInfo(pkg);
            if (this.opts.includeLicenseFile) {
              pkgInfo.licenseFile = getLicenseFileByString(pkgPath, this.opts.glob);
            } else {
              pkgInfo.licenseFile = null;
            }
            return pkgInfo;
          });
          let uniquePkgList = {};
          pkgList.forEach((pkg) => {
            if (uniquePkgList[`${pkg.name}@${pkg.version}`]) return;
            uniquePkgList[`${pkg.name}@${pkg.version}`] = pkg;
          });

          if (!chunk.isInitial()) return;

          switch (this.opts.output) {
            case 'html': {
              const filepath = path.join(this.opts.outputPath, `license-${chunk.name}.html`);
              fs.writeFileSync(filepath, generateHtml(uniquePkgList).join('\n'), 'utf-8');
              break;
            }
            default: {
              chunk.files.forEach((filename) => {
                compilation.assets[filename] = new ConcatSource(
                  generateBanner(uniquePkgList),
                  compilation.assets[filename]);
              });
            }
          }
        });

        callback();
      });
    });
  }
}

