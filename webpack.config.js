const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const outPutDist = 'dist';
  const outPutJs = 'js';
  const outPutImg = 'img';
  return {
    mode: argv.mode || 'development', // 默认为development
    entry: {
      app: './src/index.js'
    },
    output: {
      path: path.resolve(__dirname, outPutDist),
      filename: outPutJs + '/[name].[contenthash].js'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset',
          generator: {
            // filename: outPutImg + '/[name].[hash:8][ext]', // eg: DJI_0028.6cd01f15.JPG 对于经常修改同文件比较有效 可以避免缓存
            filename: outPutImg + '/[name][ext]', // origin output 方便对于重复图片不进行上传 节省流量
          },
          parser: {
            dataUrlCondition: {
              maxSize: 10240, // 10KB以下使用DataURL
            },
          },
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src/conf/conf.json'),
            to: path.resolve(__dirname, outPutDist + '/conf/conf.json')
          }
        ]
      }),
      new HtmlWebpackPlugin({
        template: './index.html'
      })
    ],
    resolve: {
      alias: {
        '@src': path.resolve(__dirname, 'src/'), // 设置根目录别名
        '@img': path.resolve(__dirname, 'src/img/') // 设置图片目录别名
      },
    },
    devtool: argv.mode === 'development' ? 'inline-source-map' : false,
  };
};
