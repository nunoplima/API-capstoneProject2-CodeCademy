const express = require("express");
const itemsRouter = express.Router({mergeParams: true});
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

itemsRouter.param("menuItemId", (req, res, next, menuItemId) => {
  db.get(`SELECT * FROM MenuItem WHERE id = ${menuItemId}`,
    (error, row) => {
      if (!row) {
        return res.sendStatus(404);
      }
      if (error) {
        next(error);
      } else {
        res.menuItem = row; // ?
        next();
      }
    }
  );
});

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

const validateFields = (req, res, next) => {
  const menuItem = req.body.menuItem;
  if (!menuItem.name || !menuItem.description || !menuItem.inventory || !menuItem.price) {
    res.sendStatus(400);
  } else {
    next();
  }
};

itemsRouter.post("/", validateFields, (req, res, next) => {
  const menuItem = req.body.menuItem;
  const query = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES (
    $name, $description, $inventory, $price, $menu_id)`;
  const values = {
    $name: menuItem.name,
    $description: menuItem.description,
    $inventory: menuItem.inventory,
    $price: menuItem.price,
    $menu_id: req.params.menuId
  };
  db.run(query, values,
    function(error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(201).send({menuItem: row});
            }
          }
        );
      }
    }
  );
});

itemsRouter.put("/:menuItemId", validateFields, (req, res, next) => {
  const menuItem = req.body.menuItem;
  const query = `UPDATE MenuItem SET 
    name = $name, 
    description = $description,
    inventory = $inventory, 
    price = $price,
    menu_id = $menu_id
    WHERE id = $menu_item_id`;
  const values = {
    $name: menuItem.name,
    $description: menuItem.description,
    $inventory: menuItem.inventory,
    $price: menuItem.price,
    $menu_id: req.params.menuId,
    $menu_item_id: req.params.menuItemId
  };
  db.run(query, values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, 
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(200).send({menuItem: row});
            }
          }
        );
      }
    }
  );
});

itemsRouter.delete("/:menuItemId", (req, res, next) => {
  db.run(`DELETE FROM MenuItem WHERE id = ${req.params.menuItemId}`,
    (error) => {
      if (error) {
        next(error);
      } else {
        res.sendStatus(204);
      }
    }
  );
});

module.exports = itemsRouter;