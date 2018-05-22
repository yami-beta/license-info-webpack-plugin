import path from "path";
import fs from "fs";
import glob from "glob";
import { ConcatSource } from "webpack-sources";

export function getLicenseFileByString(pkgPath, licenseFileGlob) {
  const licenseFiles = glob.sync(path.join(pkgPath, licenseFileGlob));
  let licenseFile = null;
  if (licenseFiles.length > 0) {
    licenseFile = fs.readFileSync(licenseFiles[0], "utf-8");
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
    repository: pkg.repository,
    pkgPath: pkg.pkgPath
  };
}

export function getPackageJson(packagePath) {
  const jsonPath = path.join(packagePath, "package.json");
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

export function getPackagePath(modulePath) {
  const modulePathAry = modulePath.split(path.sep);
  // ['', 'dev', 'node_modules', 'foo', 'node_modules', 'bar', 'lib', 'index.js']
  //                                     `-- lastNodeModulesIndex
  const lastNodeModulesIndex = modulePathAry.lastIndexOf("node_modules");
  let pkgDirIndexfromNodeModules = 2;
  if (modulePathAry[lastNodeModulesIndex + 1].startsWith("@")) {
    // check scoped modules
    pkgDirIndexfromNodeModules += 1;
  }
  const pkgPathAry = modulePathAry.slice(
    0,
    lastNodeModulesIndex + pkgDirIndexfromNodeModules
  );
  return pkgPathAry.join(path.sep);
}

export function filterNodeModules(modules) {
  return modules.filter(mod => {
    if (!mod.resource) return false;
    return mod.resource.includes("node_modules");
  });
}

export function generateBanner(modules) {
  const indent = " *";
  const banners = Object.keys(modules).map(pkgId => {
    const pkg = modules[pkgId];
    let licenseStr = `${indent}`;
    if (pkg.licenseFile) {
      licenseStr = `${indent}\n`;
      licenseStr += pkg.licenseFile
        .split(/\n/)
        .map(line => {
          if (line === "") return indent;
          return `${indent}   ${line}`;
        })
        .join("\n");
      licenseStr += `\n${indent}`;
    } else {
      licenseStr = `${indent}`;
    }

    let pkgInfoText = "";
    if (pkg.author) {
      switch (typeof pkg.author) {
        case "object": {
          pkgInfoText += `\n${indent}   author: ${pkg.author.name}${
            pkg.author.url ? ` (${pkg.author.url})` : ""
          }`;
          break;
        }
        case "string": {
          pkgInfoText += `\n${indent}   author: ${pkg.author}`;
          break;
        }
      }
    }
    if (pkg.repository) {
      switch (typeof pkg.repository) {
        case "object": {
          pkgInfoText += `\n${indent}   url: ${pkg.repository.url}`;
          break;
        }
        case "string": {
          pkgInfoText += `\n${indent}   url: ${pkg.repository}`;
          break;
        }
      }
    }
    if (pkg.maintainers && Array.isArray(pkg.maintainers)) {
      pkgInfoText += `\n${indent}   maintainers:`;
      pkg.maintainers.forEach(m => {
        switch (typeof m) {
          case "object": {
            pkgInfoText += `\n${indent}     ${m.name}${
              m.email ? ` <${m.email}>` : ""
            }${m.url ? ` (${m.url})` : ""}`;
            break;
          }
          case "string": {
            pkgInfoText += `\n${indent}     ${m}`;
            break;
          }
        }
      });
    }
    if (pkg.contributors && Array.isArray(pkg.contributors)) {
      pkgInfoText += `\n${indent}   contributors:`;
      pkg.contributors.forEach(c => {
        switch (typeof c) {
          case "object": {
            pkgInfoText += `\n${indent}     ${c.name}${
              c.email ? ` <${c.email}>` : ""
            }${c.url ? ` (${c.url})` : ""}`;
            break;
          }
          case "string": {
            pkgInfoText += `\n${indent}     ${c}`;
            break;
          }
        }
      });
    }

    return `${indent} ${pkg.name}@${pkg.version} (${pkg.license})
${pkgInfoText === "" ? `${indent}` : ` ${pkgInfoText.trim()}`}
${licenseStr}
${indent}`;
  });
  return `/*!
${banners.join("\n")}
 */
`;
}

export function generateHtml(modules) {
  const htmlAry = Object.keys(modules).map(pkgId => {
    const pkg = modules[pkgId];
    let licenseStr = "";
    if (pkg.licenseFile) {
      licenseStr = pkg.licenseFile;
    }

    let pkgInfoText = "<dl>";
    if (pkg.author) {
      pkgInfoText += "\n<dt>author</dt>";
      switch (typeof pkg.author) {
        case "object": {
          pkgInfoText += `\n<dd>${pkg.author.name}${
            pkg.author.url ? ` (${pkg.author.url})` : ""
          }</dd>`;
          break;
        }
        case "string": {
          pkgInfoText += `\n<dd>${pkg.author}</dd>`;
          break;
        }
      }
    }
    if (pkg.repository) {
      pkgInfoText += "\n<dt>url</dt>";
      switch (typeof pkg.repository) {
        case "object": {
          pkgInfoText += `\n<dd>${pkg.repository.url}</dd>`;
          break;
        }
        case "string": {
          pkgInfoText += `\n<dd>${pkg.repository}</dd>`;
          break;
        }
      }
    }
    if (pkg.maintainers && Array.isArray(pkg.maintainers)) {
      pkgInfoText += `
<dt>maintainers</dt>
<dd><ul>`;
      pkg.maintainers.forEach(m => {
        switch (typeof m) {
          case "object": {
            pkgInfoText += `<li>${m.name}${
              m.email ? ` &lt;${m.email}&gt;` : ""
            }${m.url ? ` (${m.url})` : ""}</li>`;
            break;
          }
          case "string": {
            pkgInfoText += `<li>${m}</li>`;
            break;
          }
        }
      });
      pkgInfoText += `</ul></dd>`;
    }
    if (pkg.contributors && Array.isArray(pkg.contributors)) {
      pkgInfoText += `
<dt>contributors</dt>
<dd><ul>`;
      pkg.contributors.forEach(c => {
        switch (typeof c) {
          case "object": {
            pkgInfoText += `<li>${c.name}${
              c.email ? ` &lt;${c.email}&gt;` : ""
            }${c.url ? ` (${c.url})` : ""}</li>`;
            break;
          }
          case "string": {
            pkgInfoText += `<li>${c}</li>`;
            break;
          }
        }
      });
      pkgInfoText += `</ul></dd>`;
    }
    pkgInfoText += "\n</dl>";

    return `
<h3>${pkg.name}@${pkg.version} (${pkg.license})</h3>
${pkgInfoText.trim()}
<blockquote>
  <pre>${licenseStr}</pre>
</blockquote>
`;
  });
  return htmlAry;
}

export default class LicenseInfoWebpackPlugin {
  constructor(options) {
    const defaultOptions = {
      glob: "{LICENSE,license,License}*",
      output: "banner",
      includeLicenseFile: true
    };
    this.opts = Object.assign({}, defaultOptions, options);
    this.basePath = null;
    this.chunkLicenses = [];
  }

  aggregateLicense(compilation, chunks, callback) {
    const chunkIsInitial = chunk => {
      if (typeof chunk.isInitial === "function") {
        // webpack v3
        return chunk.isInitial();
      }

      return chunk.canBeInitial();
    };

    chunks.forEach(chunk => {
      const modules = filterNodeModules(
        Array.from(chunk.modulesIterable, mod => mod)
      );
      const pkgList = modules.map(mod => {
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
      pkgList.forEach(pkg => {
        if (uniquePkgList[`${pkg.name}@${pkg.version}`]) return;
        uniquePkgList[`${pkg.name}@${pkg.version}`] = pkg;
      });

      if (!chunkIsInitial(chunk)) return;

      this.chunkLicenses.push({
        chunk,
        pkgs: uniquePkgList
      });
    });

    callback();
  }

  generateLicense(compilation, cb) {
    switch (this.opts.output) {
      case "html": {
        for (let cl of this.chunkLicenses) {
          const html = generateHtml(cl.pkgs).join("\n");
          compilation.assets[`license.${cl.chunk.name}.html`] = {
            source: () => html,
            size: () => html.length
          };
        }
        break;
      }
      default: {
        for (let cl of this.chunkLicenses) {
          // Check path.extname(filename) for append comment only `.js` files
          const re = /^\.js/;
          cl.chunk.files.forEach(filename => {
            if (!re.test(path.extname(filename))) {
              return;
            }
            compilation.assets[filename] = new ConcatSource(
              generateBanner(cl.pkgs),
              compilation.assets[filename]
            );
          });
        }
      }
    }
    cb();
  }

  apply(compiler) {
    this.basePath = path.join(compiler.context, "node_modules");

    if (compiler.hooks) {
      const plugin = { name: "license-info-webpack-plugin" };
      compiler.hooks.compilation.tap(plugin, compilation => {
        compilation.hooks.optimizeChunkAssets.tapAsync(
          plugin,
          (chunks, callback) => {
            this.aggregateLicense(compilation, chunks, callback);
          }
        );
      });
      compiler.hooks.emit.tapAsync(plugin, (compilation, cb) => {
        this.generateLicense(compilation, cb);
      });
    } else {
      // webpack v3
      compiler.plugin("compilation", compilation => {
        compilation.plugin("optimize-chunk-assets", (chunks, callback) => {
          this.aggregateLicense(compilation, chunks, callback);
        });
      });
      compiler.plugin("emit", (compilation, cb) => {
        this.generateLicense(compilation, cb);
      });
    }
  }
}
