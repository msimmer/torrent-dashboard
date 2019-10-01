const fs = require('fs')
const path = require('path')

const scripts = new Map([
  [
    path.resolve('node_modules/jquery/dist/jquery.min.js'),
    path.resolve('./public/javascripts/vendor/jquery.min.js')
  ]
])

scripts.forEach((to, from) => fs.copyFileSync(from, to))
