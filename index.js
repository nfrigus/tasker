#!/usr/bin/env node

console.time('Startup')
require('./src/globals')
require('./src/di.ts')
  .container.get("app")
  .run()
console.timeEnd('Startup')
