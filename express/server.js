"use strict";
const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const app = express();
const bodyParser = require("body-parser");

const { generateThumbnail } = require("./thumbnail");

const router = express.Router();
//router.get("/", generateThumbnail);

router.get("/", (req, res) => {
  return res
    .set("Cache-Control", "public, max-age=3600, s-maxage=10800")
    .status(200)
    .json({ result: "ddd" });
});
router.get("/another", (req, res) => res.json({ route: req.originalUrl }));
router.post("/", (req, res) => res.json({ postBody: req.body }));

app.use(bodyParser.json());
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));

module.exports = app;
module.exports.handler = serverless(app);
