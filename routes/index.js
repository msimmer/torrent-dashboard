const express = require('express')
const router = express.Router()
const db = require('../lib/db')

router.get('/', (req, res) => {
  db.getClients((error1, clients) => {
    if (error1) return res.status(500).send(error1)
    db.getTorrents((error2, torrents) => res.render('index', { clients, torrents }))
  })
})

module.exports = router
