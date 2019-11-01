const mysql = require('mysql')
const createClientsQuery = require('./create-table-clients')
const createPortsQuery = require('./create-table-ports')
const createTorrentsQuery = require('./create-table-torrents')
const createClientTorrentQuery = require('./create-table-client-torrent')

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  multipleStatements: true
})

class Database {
  constructor() {
    this.connection = connection
    this.connection.connect()
  }

  destroy() {
    this.connection.end()
  }

  drop(callback) {
    return this.connection.query(
      `
      DROP TABLE IF EXISTS client_torrents;
      DROP TABLE IF EXISTS clients;
      DROP TABLE IF EXISTS torrents;
      DROP TABLE IF EXISTS ports;
    `,
      error => {
        if (error) callback(error)
        return callback(null)
      }
    )
  }

  // Drop and re-create tables
  create(callback) {
    return this.connection.query(createClientsQuery, error1 => {
      if (error1) callback(error1)
      return this.connection.query(createPortsQuery, error2 => {
        if (error2) callback(error2)
        return this.connection.query(createTorrentsQuery, error3 => {
          if (error3) callback(error3)
          return this.connection.query(createClientTorrentQuery, error4 => {
            if (error4) callback(error4)
            return callback(null)
          })
        })
      })
    })
  }

  // Seed with n entries
  seed(n, callback) {
    const rpcMin = 9091
    const transmissionMin = 51413

    const clients = [[]]
    const ports = [[]]
    const torrents = [[]]

    // Setup client and port data
    for (let i = 0; i < n; i++) {
      const name = `transmission-${i}`
      const rpcPort = rpcMin + i
      const transmissionPort = transmissionMin + i
      const available = false

      clients[0].push([name, rpcPort, transmissionPort])
      ports[0].push([rpcPort, transmissionPort, available])
    }

    for (let i = 0; i < 5; i++) {
      const name = `Torrent-${i}.torrent`
      const hash = `hash-${i}-${String(Math.random()).slice(2)}`
      torrents[0].push([name, hash])
    }

    return this.connection.query(
      `INSERT INTO ports (rpc_port, transmission_port) VALUES ?`,
      ports,
      error1 => {
        if (error1) return callback(error1)

        return this.connection.query(
          `INSERT INTO clients (name, rpc_port, transmission_port) VALUES ?`,
          clients,
          error2 => {
            if (error2) return callback(error2)

            return this.connection.query(
              `INSERT INTO torrents (name, hash) VALUES ?`,
              torrents,
              error3 => {
                if (error3) return callback(error3)
                return callback(null)
              }
            )
          }
        )
      }
    )
  }

  getTorrents(callback) {
    return this.connection.query('SELECT * FROM torrents', (error, results) => {
      if (error) return callback(error)
      return callback(null, results)
    })
  }

  findTorrents(torrentIds, callback) {
    return this.connection.query(
      `SELECT * FROM torrents WHERE id IN (${torrentIds.join()})`,
      (error, results) => {
        if (error) return callback(error)
        return callback(null, results)
      }
    )
  }

  // Mutates
  getClientsTorrents(clients, callback) {
    // Check if the clients are an array and if the first one has been processed
    if (!clients || !clients.length || clients[0].torrents) {
      return callback(null, clients)
    }

    const client = clients.shift() // Remove from bottom

    return this.connection.query(
      `SELECT t.*
        FROM torrents AS t
        INNER JOIN client_torrents AS ct ON t.id = ct.torrent_id
        WHERE ct.client_id = ${client.id}
      `,
      (error, torrents) => {
        if (error) return callback(error)
        client.torrents = torrents
        clients.push(client) // Add to top

        return this.getClientsTorrents(clients, callback)
      }
    )
  }

  getClients(callback) {
    return this.connection.query(
      'SELECT * FROM clients',
      (error1, results1) => {
        if (error1) return callback(error1)

        // Add torrent data. Mutates
        return this.getClientsTorrents(results1, (error2, results2) => {
          if (error2) return callback(error2)
          return callback(null, results2)
        })
      }
    )
  }

  findClients(clientIds, callback) {
    return this.connection.query(
      `SELECT * FROM clients WHERE id IN (${clientIds.join()})`,
      (error1, results1) => {
        // Add torrent data. Mutates
        return this.getClientsTorrents(results1, (error2, results2) => {
          if (error2) return callback(error2)
          return callback(null, results2)
        })
      }
    )
  }

  addClients(n, callback) {
    // Get available ports
    return this.connection.query(
      `SELECT * FROM ports WHERE available = 1 LIMIT ${n}`,
      (error1, results1) => {
        if (error1) return callback(error1)
        if (!results1.length) return callback(new Error('No available ports'))

        // Save reference to ports
        const rpcPorts = results1
          .reduce((acc, curr) => acc.concat(curr.rpc_port), [])
          .join()

        // Set up insert
        const data = [
          results1.reduce(
            (acc, curr) =>
              acc.push([
                `transmission-${curr.rpc_port}`,
                curr.rpc_port,
                curr.transmission_port
              ]) && acc,
            []
          )
        ]

        // Insert rows
        return this.connection.query(
          'INSERT INTO clients (name, rpc_port, transmission_port) VALUES ?',
          data,
          error2 => {
            if (error2) return callback(error2)

            // Set available status on ports table
            return this.connection.query(
              `UPDATE ports SET available = 0 WHERE rpc_port IN (${rpcPorts})`,
              error3 => {
                if (error3) return callback(error3)

                // Get newly added clients ports
                return this.connection.query(
                  `SELECT * FROM clients WHERE rpc_port IN (${rpcPorts})`,
                  (error4, results4) => {
                    if (error4) return callback(error4)
                    return callback(null, results4)
                  }
                )
              }
            )
          }
        )
      }
    )
  }

  removeClients(ports, callback) {
    // Release ports
    const ports_ = ports.join()
    this.connection.query(
      `UPDATE ports SET available = 1 WHERE rpc_port IN (${ports_})`,
      error1 => {
        if (error1) callback(error1)

        // Update client status
        return this.connection.query(
          `DELETE FROM client_torrents WHERE torrent_id IN (
            (SELECT id FROM clients WHERE rpc_port IN (${ports_})));
          DELETE FROM clients WHERE rpc_port IN (${ports_})`,
          (error2, results2) => {
            if (error2) callback(error2)
            return callback(null, results2)
          }
        )
      }
    )
  }

  // Start clients and update port status
  startClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(
      `UPDATE clients SET active = 1 WHERE rpc_port IN (${ports_})`,
      error1 => {
        if (error1) return callback(error1)

        return this.connection.query(
          `UPDATE ports SET available = 0 WHERE rpc_port IN (${ports_})`,
          (error2, results) => {
            if (error2) return callback(error2)

            return callback(null, results)
          }
        )
      }
    )
  }

  // Stop clients and update port status
  stopClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(
      `UPDATE clients SET active = 0 WHERE rpc_port IN (${ports_})`,
      error1 => {
        if (error1) return callback(error1)

        return this.connection.query(
          `UPDATE ports SET available = 1 WHERE rpc_port IN (${ports_})`,
          (error2, results) => {
            if (error2) return callback(error2)
            return callback(null, results)
          }
        )
      }
    )
  }

  // Adds torrent data to the db
  createTorrent(fileName, hash, callback) {
    const name = `${fileName}.torrent`
    const data = [[[name, hash]]]
    return this.connection.query(
      'INSERT INTO torrents (name, hash) VALUES ?',
      data,
      (error, results) => {
        if (error) return callback(error)
        return callback(null, { id: results.insertId, name, hash })
      }
    )
  }

  // Adds a torrent to all active clients
  addTorrents(torrentIds, clientIds, callback) {
    const torrentIds_ = torrentIds.join()
    const clientTorrentIds = clientIds
      .reduce(
        (acc, cId) => acc.concat(torrentIds.map(tId => `(${cId}, ${tId})`)),
        []
      )
      .join()

    return this.connection.query(
      `INSERT INTO client_torrents (client_id, torrent_id)
        VALUES ${clientTorrentIds}
        ON DUPLICATE KEY UPDATE
          client_id = VALUES(client_id),
          torrent_id = VALUES(torrent_id)`,
      (error, results) => {
        if (error) return callback(error)
        return callback(null, results)
      }
    )
  }

  // Removes torrents from selected clients
  removeTorrents(clientIds, torrentIds, callback) {
    const clientIds_ = clientIds.join()
    const torrentIds_ = torrentIds.join()

    return this.connection.query(
      `DELETE FROM client_torrents
        WHERE torrent_id IN (${torrentIds_})
          AND client_id IN (${clientIds_})`,
      (error, results) => {
        if (error) return callback(error)
        return callback(null, results)
      }
    )
  }
}

// db.getClients(callback)
// db.addClients(2, callback)
// db.removeClients([9091, 9092], callback)
// db.startClients([9091, 9092], callback)
// db.stopClients([9091, 9092], callback)

module.exports = new Database()
