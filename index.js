#!/usr/bin/env node

console.time('Startup')
try {
  require('./build')
}
catch (e) {
  require('./src/globals')
  require('./src')
}
console.timeEnd('Startup')
