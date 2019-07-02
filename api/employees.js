const express = require("express");
const employeesRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

const timesheetsRouter = require("./timesheets");

employeesRouter.use("/:employeeId/timesheets", timesheetsRouter);

employeesRouter.param("employeeId", (req, res, next, employeeId) => {
  db.get(`SELECT * FROM Employee WHERE id = ${employeeId}`,
    (error, row) => {
      if (!row) {
        return res.sendStatus(404);
      }
      if (error) {
        next(error);
      } else {
        req.employee = row;
        next();
      }
    }
  );
});

employeesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee = 1",
    (error, rows) => {
      if (error) {
        res.sendStatus(404);
      } else {
        res.status(200).json({employees: rows});
      }
    }
  );
});

const validateFields = (req, res, next) => {
  const employee = req.body.employee
  if (!employee.name || !employee.position || !employee.wage) {
    res.sendStatus(400);
  } else {
    req.body.employee.isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
    next();
  }
};

employeesRouter.post("/", validateFields, (req, res, next) => {
  const employee = req.body.employee;
  const query = `INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $is_current_employee)`;
  const values = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $is_current_employee: employee.isCurrentEmployee
  };
  db.run(query, values,
    function(error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(201).send({employee: row});
            }
          }  
        );
      }
    }
  );
});

employeesRouter.get("/:employeeId", (req, res, next) => {
  res.status(200).send({employee: req.employee});
});

employeesRouter.put("/:employeeId", validateFields, (req, res, next) => {
  const employee = req.body.employee;
  const query = `UPDATE Employee SET 
    name = $name,
    position = $position,
    wage = $wage,
    is_current_employee = $is_current_employee
    WHERE id = $id`;
  const values = {
    $name: employee.name,
    $position: employee.position,
    $wage: employee.wage,
    $is_current_employee: employee.isCurrentEmployee,
    $id: req.params.employeeId
  };
  db.run(query, values,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(200).send({employee: row});
            }
          }
        );
      }
    }
  );
});

employeesRouter.delete("/:employeeId", (req, res, next) => {
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = ${req.params.employeeId}`,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(200).send({employee: row});
            }
          }
        );
      }
    }
  );
});


module.exports = employeesRouter;