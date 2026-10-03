import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.picklah.app",
  appName: "PickLah",
  webDir: "dist",
  server: {
    androidScheme: "http",
  },
};

export default config;
