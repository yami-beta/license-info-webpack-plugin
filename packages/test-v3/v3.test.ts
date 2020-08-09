import memoryfs from "memory-fs";
import licenseComment from "../../fixtures/license";

describe("webpack v3", () => {
  test("when license-info-webpack-plugin is used", (done) => {
    const webpack = require("webpack");
    const webpackConfig = require("./webpack.config.js");
    const expectedBanner = licenseComment();
    const compiler = webpack(webpackConfig);
    compiler.outputFileSystem = new memoryfs();

    compiler.run((err, stats) => {
      expect(err).toBeFalsy();
      expect(JSON.stringify(stats.compilation.errors)).toBe("[]");
      const compiled = stats.compilation.assets["index.js"]
        .source()
        .split("\n");
      const expected = expectedBanner.split("\n");
      for (let i = 0; i < expected.length; i++) {
        expect(compiled[i]).toBe(expected[i]);
      }

      done();
    });
  });
});
