#!/usr/bin/env node

try {
  require('./build')
}
catch (e) {
  require('./src/globals')
  require('./src')
}
