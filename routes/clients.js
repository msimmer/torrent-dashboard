const express = require('express')
const router = express.Router()
const db = require('../lib/db')
const api = require('../lib/api')

router.get('/', (req, res) => {
  db.getClients((error, data) => res.send({ error, data }))
})

// POST: { "n": 3 }
router.post('/add', (req, res) => {
  const { n } = req.body
  db.addClients(n, (error1, data) => {
    if (error1) return res.send({ error1, data })

    const clientRPCPports = []
    const clientTransmissionPports = []
    const clients = []

    // Return data from the db query, not the shell API
    data.forEach(client => {
      clientRPCPports.push(client.rpc_port)
      clientTransmissionPports.push(client.transmission_port)
      clients.push({
        name: client.name,
        active: client.active,
        rpcPort: client.rpc_port,
        transmissionPort: client.transmission_port
      })
    })

    api.addClients(clientRPCPports, clientTransmissionPports, error2 => {
      res.send({ error: error2, data: clients })
    })
  })
})

// POST: { "ports": [9000, 9001, ...] }
router.post('/remove', (req, res) => {
  const { 'ports[]': ports } = req.body
  db.removeClients(ports, (error1, data) => {
    if (error1) return res.send({ error: error1, data })
    api.removeClients(ports, (error2, data) => res.send(JSON.parse(data)))
  })
})

// POST: { "ports": [9000, 9001, ...] }
router.post('/start', (req, res) => {
  const { 'ports[]': ports } = req.body
  db.startClients(ports, (error1, data) => {
    if (error1) return res.send({ error: error1, data })
    api.startClients(ports, (error2, data) => res.send(JSON.parse(data)))
  })
})

// POST: { "ports": [9000, 9001, ...] }
router.post('/stop', (req, res) => {
  const { 'ports[]': ports } = req.body
  db.stopClients(ports, (error1, data) => {
    if (error1) return res.send({ error: error1, data })
    api.stopClients(ports, (error2, data) => res.send(JSON.parse(data)))
  })
})

module.exports = router
