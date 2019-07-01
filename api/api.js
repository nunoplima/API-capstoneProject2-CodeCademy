const express = require("express");
const apiRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

apiRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1",
    (error, rows) => {
      if (error) {
        next(error);
      } else {
        res.status(200).json({employees: rows});
      }
    }
  );
});

module.exports = apiRouter;