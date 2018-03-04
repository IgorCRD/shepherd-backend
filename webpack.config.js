const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src/server.js'),
  target: 'node',
  output: {
    filename: 'server.js',
    path: path.join(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      controllers: path.resolve(__dirname, 'src/controllers/'),
      config: path.resolve(__dirname, 'config/'),
      root: path.resolve(__dirname, ''),
    },
    extensions: ['.js'],
  },
  devtool: 'sourcemap',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
          emitError: true,
          emitWarning: true,
          failOnWarning: true,
          failOnError: true,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
