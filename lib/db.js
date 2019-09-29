const createClientsQuery = require('./create-table-clients')
const createPortsQuery = require('./create-table-ports')
const mysql = require('mysql')

const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME
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
        return callback(null)
      })
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
    return this.connection.query(`SELECT * FROM ports WHERE available = 1 LIMIT ${n}`, (error1, results1) => {
      if (error1) return callback(error1)
      if (!results1.length) return callback(new Error('No available ports'))

      // Save reference to ports
      const rpcPorts = results1.reduce((acc, curr) => acc.concat(curr.rpc_port), []).join()

      // Set up insert
      const data = [
        results1.reduce(
          (acc, curr) => acc.push([`transmission-${curr.rpc_port}`, curr.rpc_port, curr.transmission_port]) && acc,
          []
        )
      ]

      // Insert rows
      return this.connection.query('INSERT INTO clients (name, rpc_port, transmission_port) VALUES ?', data, error2 => {
        if (error2) return callback(error2)

        // Set available status on ports table
        return this.connection.query(`UPDATE ports SET available = 0 WHERE rpc_port IN (${rpcPorts})`, error3 => {
          if (error3) return callback(error3)

          // Get newly added clients ports
          return this.connection.query(`SELECT * FROM clients WHERE rpc_port IN (${rpcPorts})`, (error4, results4) => {
            if (error4) return callback(error4)
            return callback(null, results4)
          })
        })
      })
    })
  }

  removeClients(ports, callback) {
    // Release ports
    const ports_ = ports.join()
    this.connection.query(`UPDATE ports SET available = 1 WHERE rpc_port IN (${ports_})`, error1 => {
      if (error1) callback(error1)

      // Update client status
      return this.connection.query(`DELETE FROM clients WHERE rpc_port IN (${ports_})`, (error2, results2) => {
        if (error2) callback(error2)
        return callback(null, results2)
      })
    })
  }

  startClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(`UPDATE clients SET active = 1 WHERE rpc_port IN (${ports_})`, (error, results) => {
      if (error) return callback(error)
      return callback(null, results)
    })
  }

  stopClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(`UPDATE clients SET active = 0 WHERE rpc_port IN (${ports_})`, (error, results) => {
      if (error) return callback(error)
      return callback(null, results)
    })
  }
}

// const callback = (err, results, fields) => {
//   if (err) console.log('ERR!', err)
//   console.log(results)
//   console.log(fields)
//   connection.end()
// }

// const db = new Database()

// db.getClients(callback)
// db.addClients(2, callback)
// db.removeClients([9091, 9092], callback)
// db.startClients([9091, 9092], callback)
// db.stopClients([9091, 9092], callback)

module.exports = new Database()
