import path from "path";
import { ConcatSource } from "webpack-sources";
import {
  getLicenseFileByString,
  formatPackageInfo,
  getPackageJson,
  getPackagePath,
  filterNodeModules,
  generateBanner,
  generateHtml
} from "./utils";

interface LicenseInfoWebpackPluginOptions {
  glob: string;
  outputType: string;
  includeLicenseFile: boolean;
}

export default class LicenseInfoWebpackPlugin {
  opts: LicenseInfoWebpackPluginOptions;
  basePath: string | null;
  chunkLicenses: any[];

  constructor(options) {
    const defaultOptions = {
      glob: "{LICENSE,license,License}*",
      outputType: "banner",
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
    switch (this.opts.outputType) {
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
