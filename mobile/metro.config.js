// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow CSS imports (needed for mapbox-gl on web)
config.resolver.sourceExts.push('css');

module.exports = config;
