const express = require('express')
const router = express.Router()
const api = require('../lib/api')

router.post('/new', (req, res) => {
  // api.createTorrent()
})

router.post('/add', (req, res) => {
  // api.addTorrents()
})

router.post('/remove', (req, res) => {
  // api.removeTorrents()
})

module.exports = router
