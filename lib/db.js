const mysql = require('mysql')
const createClientsQuery = require('./create-table-clients')
const createPortsQuery = require('./create-table-ports')
const createTorrentsQuery = require('./create-table-torrents')

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

  // Create tables
  create(callback) {
    return this.connection.query(createClientsQuery, error1 => {
      if (error1) callback(error1)
      return this.connection.query(createPortsQuery, error2 => {
        if (error2) callback(error2)
        return this.connection.query(createTorrentsQuery, error3 => {
          if (error3) callback(error3)
          return callback(null)
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

    // Setup client and port data
    for (let i = 0; i <= n; i++) {
      const name = `transmission-${i}`
      const rpcPort = rpcMin + i
      const transmissionPort = transmissionMin + i

      clients[0].push([name, rpcPort, transmissionPort])
      ports[0].push([rpcPort, transmissionPort])
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

            const active = ports[0].slice(0, Math.round(n / 2))
            return this.startClients(active, (error3, data) => {
              if (error3) return callback(error3)
              return callback(null, data)
            })
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

  getClients(callback) {
    return this.connection.query('SELECT * FROM clients', (error, results) => {
      if (error) return callback(error)
      return callback(null, results)
    })
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
          `DELETE FROM clients WHERE rpc_port IN (${ports_})`,
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
  addTorrents(torrentIds, callback) {
    const torrentIds_ = torrentIds.join()
    return this.connection.query(
      `UPDATE torrents SET active = 1 WHERE id IN (${torrentIds_})`,
      (error, results) => {
        if (error) return callback(error)
        return callback(null, results)
      }
    )
  }

  // Removes a torrent from all active clients
  removeTorrents(torrentIds, callback) {
    const torrentIds_ = torrentIds.join()
    return this.connection.query(
      `UPDATE torrents SET active = 0 WHERE id IN (${torrentIds_})`,
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
