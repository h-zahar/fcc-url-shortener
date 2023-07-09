require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns")
const app = express();

const mongoUri = process.env["DB_URI"]
  .replace("<user>", process.env["DB_USER"])
  .replace("<pass>", process.env["DB_PASS"])
  .replace("<db>", process.env["DB_NAME"]);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: Number,
    required: true,
  },
});

let Url = mongoose.model("Url", urlSchema);

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  const { shorturl } = req.params;
  if (isNaN(shorturl) && Math.ceil(shorturl) - Math.floor(shorturl) !== 0)
    return res.json({ error: "Wrong Parameter!" });
  Url.find({ shortUrl: Number(shorturl) })
    .then((data) => {
      if (data.length === 0) {
        res.json({ error: "Not Added!" });
      } else {
        res.redirect(data[0].originalUrl);
      }
    })
    .catch((err) => res.json(err));
});

app.post("/api/shorturl", (req, res) => {
  try {
    const { url } = req.body;
    try {
      dns.lookup(new URL(url));
    } finally {
      
    }
    // createUrl = new Url({ originalUrl: url, shortUrl: 0 });
    // createUrl.save().then(data => res.json(data)).catch(err => res.json(err));
    // const checkUrl = new URL(url);

    Url.find({ originalUrl: url })
      .then((data) => {
        if (data.length === 0) {
          Url.find({})
            .count()
            .exec()
            .then((count) => {
              createUrl = new Url({ originalUrl: url, shortUrl: count });
              createUrl
                .save()
                .then((data) =>
                  res.json({
                    original_url: data.originalUrl,
                    short_url: data.shortUrl,
                  })
                )
                .catch((err) => res.json(err));
            })
            .catch((err) => res.json(err));
        } else {
          res.json({
            original_url: data[0].originalUrl,
            short_url: data[0].shortUrl,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.json(err);
      });
  } catch (err) {
    if (err.code === "ERR_INVALID_ARG_TYPE" || err.code === "ERR_INVALID_URL")
      return res.json({ error: "invalid url" });
    res.json(err);
  }

  // Url.find({}).count().exec()
  //   .then(data => res.json(data))
  //   .catch(err => res.json(err));
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
