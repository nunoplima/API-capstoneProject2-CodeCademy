const express = require("express");
const timesheetsRouter = express.Router({mergeParams: true});
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

timesheetsRouter.param("timesheetId", (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`,
    (error, row) => {
      if (!row) {
        res.sendStatus(404);
      } else {
        next();
      }
    }
  );
});

timesheetsRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE employee_id = ${req.params.employeeId}`,
    (error, rows) => {
      if (!rows) {
        return res.sendStatus(404);
      } 
      if (error) {
        next(error);
      } else {
        res.status(200).send({timesheets: rows});
      }
    }
  );
});

const validateFields = (req, res, next) => {
  const timesheet = req.body.timesheet;
  if(!timesheet.hours || !timesheet.rate || !timesheet.date) {
    res.sendStatus(400);
  } else {
    next();
  }
};

timesheetsRouter.post("/", validateFields, (req, res, next) => {
  const timesheet = req.body.timesheet;
  const query = `INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)`;
  const values = {
    $hours: timesheet.hours,
    $rate: timesheet.rate,
    $date: timesheet.date,
    $employee_id: req.params.employeeId
  };
  
  db.run(query, values,
    function(error) {
      if(error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
          (error, row) => {
            res.status(201).send({timesheet: row});
          }
        );
      }
    }
  );
});

timesheetsRouter.put("/:timesheetId", validateFields, (req, res, next) => {
  const timesheet = req.body.timesheet;
  const query = `UPDATE Timesheet SET 
    hours = $hours, 
    rate = $rate,
    date = $date,
    employee_id = $employee_id
    WHERE id = $id`;
  const values = {
    $hours: timesheet.hours,
    $rate: timesheet.rate,
    $date: timesheet.date,
    $employee_id: req.params.employeeId,
    $id: req.params.timesheetId,
  };
  db.run(query, values, 
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(200).send({timesheet: row});
            }
          }
        );
      }
    }
  );
});

timesheetsRouter.delete("/:timesheetId", (req, res, next) => {
  db.run(`DELETE FROM Timesheet WHERE id = ${req.params.timesheetId}`,
    (error) => {
      if (error) {
        next(error);
      } else {
        res.sendStatus(204);
      }
    }
  );
});

module.exports = timesheetsRouter;