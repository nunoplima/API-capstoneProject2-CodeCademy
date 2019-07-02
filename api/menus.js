const express = require("express");
const menusRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

const itemsRouter = require("./menuItems");

menusRouter.param("menuId", (req, res, next, menuId) => {
  db.get(`SELECT * FROM Menu WHERE id = ${menuId}`,
    (error, row) => {
      if (!row) {
        return res.sendStatus(404);
      } 
      if (error) {
        next(error);
      } else {
        req.menu = row;
        next();
      }
    }
  );
});

menusRouter.use("/:menuId/menu-items", itemsRouter);

menusRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Menu`,
    (error, rows) => {
      if (error) {
        next(error);
      } else {
        res.status(200).send({menus: rows});
      }
    }
  );
});

const validateFields = (req, res, next) => {
  if (!req.body.menu.title) {
    res.sendStatus(400);
  } else {
    next()
  }
};

menusRouter.post("/", validateFields, (req, res, next) => {
  const title = req.body.menu.title;
  const query = `INSERT INTO Menu (title) VALUES ($title)`;
  const value = {$title: title};
  db.run(query, value, 
    function(error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Menu WHERE id = ${this.lastID}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(201).send({menu: row});
            }
          }
        );
      }
    }
  );
});

menusRouter.get("/:menuId", (req, res, next) => {
  res.status(200).send({menu: req.menu});
});

menusRouter.put("/:menuId", validateFields, (req, res, next) => {
  const title = req.body.menu.title;
  const query = `UPDATE Menu SET title = $title WHERE id = $id`;
  const values = {
    $title: title,
    $id: req.params.menuId
  };
  db.run(query, values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Menu WHERE id = ${req.params.menuId}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(200).send({menu: row});
            }
          }
        );
      }
    }
  );
});

// menusRouter.delete("/:menuId", (req, res, next) => {
  
// });

module.exports = menusRouter;