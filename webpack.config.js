const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const iconv = require('iconv-lite');
const fs = require('fs');

// Плагин для конвертации бандла в CP1251
class CP1251ConversionPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CP1251ConversionPlugin', (compilation) => {
      const assets = compilation.getAssets();
      
      for (const asset of assets) {
        if (asset.name === 'index.js') {
          const filePath = path.join(compilation.outputOptions.path, asset.name);
          const content = fs.readFileSync(filePath, 'utf8');
          const encodedContent = iconv.encode(content, 'windows-1251');
          fs.writeFileSync(filePath, encodedContent);
          console.log(`File ${asset.name} has been converted to CP1251.`);
        }
      }
    });
  }
}

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
    new CP1251ConversionPlugin(),
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
