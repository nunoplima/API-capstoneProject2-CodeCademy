const express = require("express");
const itemsRouter = express.Router({mergeParams: true});
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

itemsRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE menu_id = ${req.params.menuId}`,
    (error, rows) => {
      if (error) {
        next(error);
      } else {
        res.status(200).send({menuItems: rows});
      }
    }
  );      
});

module.exports = itemsRouter;