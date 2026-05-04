const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Prevent Metro from watching native iOS/Android source directories
// inside pnpm's extracted packages — these directories don't exist in
// the Replit sandbox and cause ENOENT watcher crashes.
config.resolver.blockList = [
  /node_modules\/.pnpm\/.*\/ios\/.*/,
  /node_modules\/.pnpm\/.*\/android\/.*/,
  /node_modules\/.pnpm\/.*_tmp_[0-9]+\/.*/,
];

module.exports = config;
