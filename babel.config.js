module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // O plugin do worklets tem de ser o ÚLTIMO da lista (exigência do
    // react-native-reanimated 4).
    plugins: ['react-native-worklets/plugin'],
  };
};
