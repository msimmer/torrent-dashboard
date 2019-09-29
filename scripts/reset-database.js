const db = require('../lib/db')

db.create(err => {
  if (err) throw err
  db.seed(10, err => {
    if (err) throw err
    db.destroy()
  })
})
