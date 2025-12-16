// with-android-debug-keystore.js
const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidDebugKeystore = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      // 1. Path to your stable keystore (outside android folder)
      const sourceKeystorePath = path.join(projectRoot, 'certs', 'debug.keystore');
      
      // 2. Path where the Android build expects it to be
      const destinationKeystorePath = path.join(projectRoot, 'android', 'app', 'debug.keystore');

      // 3. Check if source exists, then copy it
      if (fs.existsSync(sourceKeystorePath)) {
        console.log(`🔑 Copying stable debug.keystore to android/app/...`);
        fs.copyFileSync(sourceKeystorePath, destinationKeystorePath);
      } else {
        console.warn(
          `⚠️ Warning: Custom debug.keystore not found at ${sourceKeystorePath}. Using default.`
        );
      }
      return config;
    },
  ]);
};

module.exports = withAndroidDebugKeystore;