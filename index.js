require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const shortId = require('shortid')
const validUrl = require('valid-url')
const app = express();

// import "mongoose" - required for DB Access
const mongoose = require('mongoose');
// URI
const DB = require('./config/db');

mongoose.connect(process.env.URI || DB.URI, {useNewUrlParser: true, useUnifiedTopology: true});

let mongoDB = mongoose.connection;
mongoDB.on('error', console.error.bind(console, 'Connection Error:'));
mongoDB.once('open', ()=> {
  console.log("Connected to MongoDB...");
});

const URL = require('./models/url')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({
  extended: false
}))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url
  const urlCode = shortId.generate()
  
  //check if url is valid
  const httpRegex = /^(http|https)(:\/\/)/; 
  if (!httpRegex.test(url)) {
    return res.json({ error: 'invalid url' })
  } else {
    try {
      // check if url exist in database
      let findOne = await URL.findOne({
        original_url: url
      })
      if (findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch (err) {
      console.error(err)
      res.status(500).json('Server error...')
    }
  }
})

app.get('/api/shorturl/:short_url', async (req, res) => {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })
    if (urlParams) {
      console.log(urlParams)
      res.redirect(urlParams.original_url)
    } else {
      res.status(404).json('URL not found')
    }
  } catch (err) {
    console.error(err)
    res.status(500).json('Server error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
