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
        return this.connection.query(
          `UPDATE ports SET available = 0 WHERE rpc_port IN (${rpcPorts})`,
          (error3, results3) => {
            callback(null, results3)
          }
        )
      })
    })
  }

  removeClients() {}

  startClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(`UPDATE clients SET active = 1 WHERE rpc_port IN (${ports_})`, (error, results) => {
      if (error) return callback(error)
      callback(null, results)
    })
  }

  stopClients(ports, callback) {
    const ports_ = ports.join()
    return this.connection.query(`UPDATE clients SET active = 0 WHERE rpc_port IN (${ports_})`, (error, results) => {
      if (error) return callback(error)
      callback(null, results)
    })
  }
}

// module.exports = new Database()

const db = new Database()
const callback = (err, results) => {
  if (err) console.log('ERR!', err)
  console.log(results)
  connection.end()
}

// db.getClients(callback)
// db.addClients(2, callback)
// db.startClients([9091, 9092], callback)
// db.stopClients([9091, 9092], callback)

/**
CREATE TABLE `clients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `rpc_port` bigint(20) unsigned NOT NULL,
  `transmission_port` bigint(20) unsigned NOT NULL,
  `active` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rpc_port` (`rpc_port`),
  UNIQUE KEY `transmission_port` (`transmission_port`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
 */
