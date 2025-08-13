#!/usr/bin/env node

try {
  require("../dist/src/index.js");
} catch (e) {
  console.error("Please run 'npm run build' first!");
}
