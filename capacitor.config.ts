import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.tjark.agentstudio',
  appName: 'Agent Studio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
