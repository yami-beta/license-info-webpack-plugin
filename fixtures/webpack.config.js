const path = require("path");
const LicenseInfoWebpackPlugin = require("../../src/index").default;

module.exports = {
  entry: {
    index: path.join(__dirname, "src", "index.js")
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".js", ".jsx"]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["babel-preset-env"]
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new LicenseInfoWebpackPlugin({
      output: "banner",
      includeLicenseFile: true
    })
  ]
};
