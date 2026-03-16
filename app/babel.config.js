module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Zustand's middleware barrel-exports `devtools` which uses import.meta.env.
      // Metro outputs a non-module <script>, where import.meta is a SyntaxError.
      // This plugin replaces import.meta with an object backed by process.env.NODE_ENV,
      // which Expo/Metro already defines correctly for dev vs prod.
      function importMetaShim() {
        return {
          visitor: {
            MetaProperty(path) {
              if (
                path.node.meta.name === 'import' &&
                path.node.property.name === 'meta'
              ) {
                path.replaceWithSourceString(
                  '({env:{MODE:process.env.NODE_ENV||"development"}})'
                );
              }
            },
          },
        };
      },
    ],
  };
};
