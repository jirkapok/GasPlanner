// Karma configuration for the performance tests, see "npm run test-performance"
const baseConfig = require('./karma.conf.js');

module.exports = function (config) {
  baseConfig(config);
  config.set({
    browsers: ['ChromeHeadlessPerformance'],
    customLaunchers: {
      ChromeHeadlessPerformance: {
        base: 'ChromeHeadless',
        // precise heap sizes and manual garbage collection for the memory measurement
        flags: ['--enable-precise-memory-info', '--js-flags=--expose-gc']
      }
    },
    singleRun: true,
    autoWatch: false,
    restartOnFileChange: false,
    // the longest dive is calculated synchronously for minutes without reporting any progress
    browserNoActivityTimeout: 30 * 60 * 1000
  });
};
