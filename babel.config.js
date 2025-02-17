module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],

    plugins: [
      "@tamagui/babel-plugin",
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
