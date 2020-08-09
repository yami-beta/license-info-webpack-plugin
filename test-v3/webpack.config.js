const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const LicenseInfoWebpackPlugin = require("../lib").default;

module.exports = {
  entry: {
    index: path.join(__dirname, "..", "fixtures", "src", "index.js"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new LicenseInfoWebpackPlugin({
      outputType: "banner",
      includeLicenseFile: true,
    }),
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: /^\**!|@preserve|@license|@cc_on/,
        },
      },
    }),
  ],
  context: path.join(__dirname),
};
