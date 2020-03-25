import path from "path";
import fs from "fs";
import glob from "glob";

function getLicenseFileByString(pkgPath, licenseFileGlob) {
  const licenseFiles = glob.sync(path.join(pkgPath, licenseFileGlob));
  let licenseFile = null;
  if (licenseFiles.length > 0) {
    licenseFile = fs.readFileSync(licenseFiles[0], "utf-8");
  }
  return licenseFile;
}

interface PackageInfo {
  name: string;
  version: string;
  author: string;
  license: any;
  maintainers: any;
  contributors: any;
  repository: any;
  pkgPath: string;
  licenseFile?: string;
}
function formatPackageInfo(pkg): PackageInfo {
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

function getPackageJson(packagePath) {
  const jsonPath = path.join(packagePath, "package.json");
  return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
}

function getPackagePath(modulePath) {
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

function filterNodeModules(modules) {
  return modules.filter(mod => {
    if (!mod.resource) return false;
    return mod.resource.includes("node_modules");
  });
}

function generateBanner(modules) {
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
${banners.join("\n").replace(/\*\//g , '* /')}
 */
`;
}

function generateHtml(modules) {
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

export {
  getLicenseFileByString,
  formatPackageInfo,
  getPackageJson,
  getPackagePath,
  filterNodeModules,
  generateBanner,
  generateHtml
};
