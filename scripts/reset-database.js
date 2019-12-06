const db = require("../lib/db");

db.drop(err => {
  if (err) throw err;
  db.create(err => {
    if (err) throw err;
    db.seed(3, err => {
      if (err) throw err;
      db.destroy();
    });
  });
});
