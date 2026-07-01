module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "http": require.resolve("stream-http"),
          "https": require.resolve("https-browserify"),
          "stream": require.resolve("stream-browserify"),
          "zlib": require.resolve("browserify-zlib"),
          "path": require.resolve("path-browserify"),
          "crypto": require.resolve("crypto-browserify"),
          "querystring": require.resolve("querystring-es3"),
          "url": require.resolve("url/"),
          "util": require.resolve("util/"),
          "fs": false,
          "net": false,
          "tls": false,
          "child_process": false,
          "aws-sdk": false
        }
      }
    }
  },
  devServer: {
    host: '0.0.0.0',
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
};