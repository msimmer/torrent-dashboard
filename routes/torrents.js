const path = require('path')
const express = require('express')
const db = require('../lib/db')
const api = require('../lib/api')
const router = express.Router()

function prepareTorrentUpdate(res, torrentIds, callback) {
  // Get clients and filter out inactive ones
  db.getClients((error1, data) => {
    const ports = data.filter(client => client.active)

    // End if no clients
    if (!ports.length) return res.send({ error: null, data: {} })

    // Get torrent data based on the IDs passed in
    db.getTorrents(error2 => {
      if (error2) return res.send({ error2, data: {} })

      // Create the torrent objects that will be passed the API
      const torrents = data.reduce((acc, torrent) => {
        if (!torrentIds.includes(torrent.id)) return acc
        return acc.concat(torrent.name)
      }, [])

      // End if no torrents
      if (!torrents.length) return res.send({ error: null, data: {} })

      callback(ports, torrents)
    })
  })
}

router.post('/new', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.')
  }

  // The name of the input field used to retrieve the uploaded file
  const { torrent } = req.files
  const { name: fileName } = torrent

  // Use the mv() method to place the file somewhere on your server
  torrent.mv(path.join(process.env.TMP_DIR, fileName), error1 => {
    if (error1) return res.send({ error: error1, data: {} })

    api.createTorrent(fileName, (error2, data) => {
      if (error2) return res.send({ error: error2, data: {} })

      const response = JSON.parse(data)
      const { hash } = response.data

      db.createTorrent(fileName, hash, (error3, result) => {
        if (error3) return res.send({ error: error3, data: {} })
        res.send(result)
      })
    })
  })
})

// Add a torrent to all clients. Pass in torrent IDs through the UI and do
// queries here to get the active ports and torrent names to pass to the API
router.post('/add', (req, res) => {
  let { 'torrents[]': torrentIds } = req.body

  if (!Array.isArray(torrentIds)) torrentIds = [torrentIds]
  torrentIds = torrentIds.map(Number) // cast type

  prepareTorrentUpdate(res, torrentIds, (ports, torrents) => {
    // Add the torrents to the active clients with the API
    api.addTorrents(ports, torrents, error1 => {
      if (error1) return res.send({ error: error1, data: {} })
      // Update the torrents in the database by setting them to 'active'
      db.addTorrents(torrentIds, error2 => {
        res.send({ error: error2, data: {} })
      })
    })
  })
})

// Remove a torrent from all clients
router.post('/remove', (req, res) => {
  let { 'torrents[]': torrentIds } = req.body

  if (!Array.isArray(torrentIds)) torrentIds = [torrentIds]
  torrentIds = torrentIds.map(Number) // cast type

  prepareTorrentUpdate(res, torrentIds, (ports, torrents) => {
    // Remove the torrents from the active clients with the API
    api.removeTorrents(ports, torrents, error1 => {
      if (error1) return res.send({ error: error1, data: {} })

      // Update the torrents in the database by setting them to 'active'
      db.removeTorrents(torrentIds, error2 => {
        res.send({ error: error2, data: {} })
      })
    })
  })
})

module.exports = router
