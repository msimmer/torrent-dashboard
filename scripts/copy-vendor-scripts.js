const fs = require('fs')

const scripts = new Map([
  [
    './node_modules/jquery/dist/jquery.min.js',
    './public/javascripts/vendor/jquery.min.js'
  ]
])

scripts.forEach((to, from) => fs.copyFileSync(from, to))
