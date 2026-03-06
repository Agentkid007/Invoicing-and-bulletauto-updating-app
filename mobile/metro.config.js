// metro.config.js
// Extends the default Expo Metro config to watch the shared/ folder at the
// monorepo root so that `import ... from '../../shared/...'` works in mobile.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the shared/ folder so Metro can resolve cross-package imports
config.watchFolders = [workspaceRoot];

// Resolve modules from mobile/node_modules first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

module.exports = config;
