const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();

const fileDir = process.env.FILE_DIR;

router.get("/:name", (req, res, next) => {
  if (!req.params || !req.params.name) {
    return next(new Error("No file name provided"));
  }

  const filePath = path.join(fileDir, req.params.name);

  if (!fs.existsSync(filePath)) {
    return next(new Error(`File "${filePath}" does not exist`));
  }

  res.download(filePath);
});

module.exports = router;
