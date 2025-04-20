module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "os": false,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url/")
  };
  return config;
};
