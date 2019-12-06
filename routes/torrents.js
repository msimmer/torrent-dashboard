const path = require("path");
const express = require("express");
const db = require("../lib/db");
const api = require("../lib/api");
const router = express.Router();

router.post("/new", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field used to retrieve the uploaded file
  const { torrent } = req.files;
  const { name } = torrent;
  const fileName = `${path
    .basename(name, path.extname(name))
    .replace(/[^a-zA-Z0-9]/g, "-")}${path.extname(name)}`;

  // Use the mv() method to place the file somewhere on your server
  torrent.mv(path.join(process.env.TMP_DIR, fileName), error1 => {
    if (error1) return res.send({ error: error1, data: {} });

    api.createTorrent(fileName, (error2, data) => {
      if (error2) return res.send({ error: error2, data: {} });

      const response = JSON.parse(data);
      const { hash } = response.data;

      console.log(hash);

      api.addWhitelistedHashes([hash], error3 => {
        if (error3) return res.send({ error: error3, data: {} });

        api.restartTracker(error4 => {
          if (error4) return res.send({ error: error4, data: {} });

          db.createTorrent(fileName, hash, (error5, result) => {
            if (error5) return res.send({ error: error5, data: {} });
            res.send(result);
          });
        });
      });
    });
  });
});

// Add a torrent to clients. Pass in torrent IDs through the UI and do
// queries here to get the active ports and torrent names to pass to the API
router.post("/add", (req, res) => {
  let { "torrents[]": torrentIds } = req.body;
  let { "clients[]": clientIds } = req.body;

  if (!Array.isArray(torrentIds)) torrentIds = [torrentIds];
  if (!Array.isArray(clientIds)) clientIds = [clientIds];

  // cast type
  torrentIds = torrentIds.map(Number);
  clientIds = clientIds.map(Number);

  db.findClients(clientIds, (error1, clientData) => {
    if (error1) return res.send({ error1, data: {} });
    const ports = clientData.map(client => client.rpc_port);

    db.findTorrents(torrentIds, (error2, torrentData) => {
      if (error2) return res.send({ error2, data: {} });
      const names = torrentData.map(torrent => torrent.name);

      // Add the torrents to the active clients with the API
      api.addTorrents(ports, names, error3 => {
        if (error3) return res.send({ error: error3, data: {} });

        db.addTorrents(torrentIds, clientIds, error4 => {
          res.send({ error: error4, data: {} });
        });
      });
    });
  });
});

// Remove a torrent from all clients
router.post("/remove", (req, res) => {
  let { "torrents[]": torrentIds } = req.body;
  let { "clients[]": clientIds } = req.body;

  if (!torrentIds.length || !clientIds.length) {
    return res.send({
      error: { message: "Torrent IDs and Client IDs are required" },
      data: {}
    });
  }

  if (!Array.isArray(torrentIds)) torrentIds = [torrentIds];
  if (!Array.isArray(clientIds)) clientIds = [clientIds];

  // Cast types
  torrentIds = torrentIds.map(Number);
  clientIds = clientIds.map(Number);

  db.findClients(clientIds, (error1, clientData) => {
    if (error1) return res.send({ error1, data: {} });
    const ports = clientData.map(client => client.rpc_port);

    // Get torrent hashes to pass to API
    const hashes = clientData.reduce(
      (acc, curr) =>
        acc.concat(
          curr.torrents.reduce(
            (acc2, curr2) =>
              torrentIds.includes(curr2.id) ? acc2.concat(curr2.hash) : acc2,
            []
          )
        ),
      []
    );

    // Remove the torrents from the active clients with the API
    api.removeTorrents(ports, hashes, error1 => {
      if (error1) return res.send({ error: error1, data: {} });

      // Update the torrents in the database by setting them to 'inactive'
      db.removeTorrents(clientIds, torrentIds, error2 => {
        res.send({ error: error2, data: {} });
      });
    });
  });
});

module.exports = router;
