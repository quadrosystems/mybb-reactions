const path = require('path');

const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 9000;


module.exports = {
  // mode: 'development',
  entry: './src/index.ts',
  devtool: 'source-map',

  devServer: {
    hot: false,
    liveReload: false,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },

    host: host,
    port: port,
  },
  stats: {
    // preset: 'detailed',
    errorDetails: true,
  },

  plugins: [
    // new MiniCssExtractPlugin({
    //   filename: 'index.css',
    // }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx|tsx|ts)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },

      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    clean: true,

    library: {
      name: 'ReactionsPlugin',
      type: 'var',
      export: 'default',
    },

    // library: {
    //   type: 'umd',
    //   name: 'ReactionsPlugin',
    //   export: 'default',
    //   umdNamedDefine: true,
    // },
    // globalObject: 'this',

  },

};
