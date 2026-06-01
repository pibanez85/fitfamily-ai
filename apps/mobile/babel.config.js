module.exports = function (api) {
  api.cache(true);
  // babel-preset-expo (SDK 56) ya configura el plugin de react-native-worklets /
  // reanimated automaticamente. No agregamos el plugin manualmente para evitar el
  // error "react-native-reanimated/plugin was moved to react-native-worklets".
  return {
    presets: ["babel-preset-expo"],
  };
};
