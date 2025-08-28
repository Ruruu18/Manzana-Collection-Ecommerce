const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Customize the config before returning it
config.resolver.alias = {
  "react-native-svg": "react-native-svg",
};

// Enable symlinks for development
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
