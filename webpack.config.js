
const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');

module.exports = {
  entry: './lib/index.js',
  output: {
    path: __dirname + '/lib/',
    filename: 'databrowser.js',
    publicPath: './lib/'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.png$/, use: 'file-loader' }
    ]
  },
  //devtool: 'eval-source-map',
  resolve: {
    alias: {
      typedfastbitset$: path.resolve(__dirname, "src/typedfastbitset.js"),
    }
  },
  optimization: {
    minimizer: [new TerserPlugin({
      parallel: true,
      terserOptions: {
        output: {
          ascii_only: true,
          beautify: false,
       }
     }
    })
    ],
  }
};
