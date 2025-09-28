import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'shelf-label-inventory-app',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: ['192.168.31.57', 'localhost']
  }
};

export default config;
