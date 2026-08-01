import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Baseball Quest Arena',
  slug: 'baseball',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1B3A6B',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.microapps.baseball',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1B3A6B',
    },
    package: 'com.microapps.baseball',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'baseball-placeholder',
    },
  },
};

export default config;
