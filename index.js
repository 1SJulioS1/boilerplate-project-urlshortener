require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const URL = require("url").URL;
const bodyParser = require("body-parser");
const { connectToDatabase } = require("./config/dbConn.js");
const { ObjectId } = require("mongodb");
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

app.post("/api/shorturl/:url?", async (req, res) => {
  const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
  };
  const db = await connectToDatabase();
  const collection = db.collection("URL");
  if (!req.params.url) {
    const duplicate = await collection.findOne({ url: req.body.url });
    if (duplicate) {
      return res.json({ original_url: req.body.url, short_url: duplicate._id });
    } else {
      const result = await collection.insertOne({
        url: req.body.url,
      });
      return res.json({
        original_url: req.body.url,
        short_url: result.insertedId.toString(),
      });
    }
  } else {
    const result = await collection.findOne({
      _id: new ObjectId(req.params.url),
    });
    if (result) {
      if (validUrl.isUri(result.url)) {
        res.redirect(result.url);
      } else {
        return res.json({ error: "invalid url" });
      }
    }
  }
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
