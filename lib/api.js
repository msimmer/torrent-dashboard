/* API for running shell scripts */

const { spawn } = require("child_process");

class API {
  exec(script, args, callback) {
    const proc = spawn(script, args);

    let stdout = "";
    let stderr = "";

    console.log(`Running %s with arguments %s`, script, args.join(" "));

    proc.stdout.on("data", data => (stdout += String(data)));
    proc.stderr.on("data", data => (stderr += String(data)));

    proc.on("close", code => {
      if (code !== 0) return callback(stderr.trim());
      return callback(null, stdout.trim());
    });
  }

  addClients(rpcPorts, transmissionPorts, callback) {
    let args = [];
    args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), args);
    args = transmissionPorts.reduce(
      (acc, port) => acc.concat(["-P", port]),
      args
    );

    this.exec(process.env.SCRIPT_CREATE_CLIENTS, args, callback);
  }

  removeClients(rpcPorts, callback) {
    const args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), []);
    this.exec(process.env.SCRIPT_REMOVE_CLIENTS, args, callback);
  }

  startClients(rpcPorts, callback) {
    const args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), []);
    this.exec(process.env.SCRIPT_START_CLIENTS, args, callback);
  }

  stopClients(rpcPorts, callback) {
    const args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), []);
    this.exec(process.env.SCRIPT_STOP_CLIENTS, args, callback);
  }

  createTorrent(fileName, callback) {
    this.exec(process.env.SCRIPT_CREATE_TORRENT, [fileName], callback);
  }

  addTorrents(rpcPorts, torrents, callback) {
    let args = [];
    args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), args);
    args = torrents.reduce((acc, name) => acc.concat(["-t", name]), args);

    this.exec(process.env.SCRIPT_ADD_TORRENTS, args, callback);
  }

  removeTorrents(rpcPorts, torrents, callback) {
    let args = [];
    args = rpcPorts.reduce((acc, port) => acc.concat(["-p", port]), args);
    args = torrents.reduce((acc, hash) => acc.concat(["-t", hash]), args);

    this.exec(process.env.SCRIPT_REMOVE_TORRENTS, args, callback);
  }

  addWhitelistedHashes(hashes, callback) {
    const args = hashes.reduce((acc, hash) => acc.concat(["-h", hash]), []);
    this.exec(process.env.SCRIPT_TRACKER_ADD_TORRENTS, args, callback);
  }

  removeWhitelistedHashes(hashes, callback) {
    const args = hashes.reduce((acc, hash) => acc.concat(["-h", hash]), []);
    this.exec(process.env.SCRIPT_TRACKER_REMOVE_TORRENTS, args, callback);
  }

  restartTracker(callback) {
    this.exec(process.env.SCRIPT_TRACKER_RESTART, [], callback);
  }
}

// const callback = (err, data) => {
//   if (err) return console.log('ERR!', err)
//   console.log(data)
// }

// const api = new API()
// api.addClients([9091, 9092], [5111, 5222], callback)
// api.removeClients([9091, 9092], callback)
// api.startClients([9091, 9092], callback)
// api.stopClients([9091, 9092], callback)
// api.addTorrents([9091, 9092], ['torrent-1', 'torrent-2'], callback)
// api.removeTorrents([9091, 9092], ['torrent-1', 'torrent-2'], callback)
// api.createTorrent('foo', callback)

module.exports = new API();
