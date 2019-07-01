const express = require("express");
const app = express();
const cors = require("cors");
const errorHandler = require("errorhandler");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const apiRouter = require("./api/api");

const PORT = process.env.PORT || 4000;

app.use(cors(), morgan("dev"), bodyParser.json());

app.use("/api", apiRouter);

app.use(errorHandler());

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;