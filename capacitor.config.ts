import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.googleresenas.portal',
  appName: 'Portal de Negocio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'app.googleresenas.com',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: 'release-key.keystore',
      keystoreAlias: 'google-resenas-key',
    },
  },
  ios: {
    scheme: 'GoogleResenasPortal',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
