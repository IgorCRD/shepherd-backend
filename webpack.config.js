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
      root: path.resolve(__dirname, ''),
      api: path.resolve(__dirname, 'src/api/'),
      config: path.resolve(__dirname, 'src/config/'),
      controllers: path.resolve(__dirname, 'src/controllers/'),
      db: path.resolve(__dirname, 'src/db'),
      models: path.resolve(__dirname, 'src/models'),
    },
    extensions: ['.js'],
  },
  devtool: 'source-map',
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
