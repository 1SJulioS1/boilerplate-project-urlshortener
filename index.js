require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const URL = require("url").URL;
const bodyParser = require("body-parser");
const { connectToDatabase } = require("./config/dbConn.js");
const { ObjectId } = require("mongodb");
const { nanoid } = require("nanoid");
var validUrl = require("valid-url");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection("URL");
  const duplicate = await collection.findOne({ original_url: req.body.url });
  if (duplicate) {
    return res.json({
      original_url: req.body.url,
      short_url: duplicate.short_url,
    });
  } else {
    if (validUrl.isWebUri(req.body.url)) {
      const short_url = nanoid(4);
      const result = await collection.insertOne({
        original_url: req.body.url,
        short_url,
      });
      return res.json({
        original_url: req.body.url,
        short_url,
      });
    } else {
      return res.json({ error: "invalid url" });
    }
  }
});
app.post("/api/shorturl/:short_url", async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection("URL");

  const result = await collection.findOne({
    short_url: req.params.short_url,
  });
  if (result) {
    res.redirect(result.original_url);
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
