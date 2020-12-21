const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/alwSaveTabs', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to Mongo!');
  }).catch(err => {
    console.error('Error connecting to mongo!', err);
  })

const WindowsModel = require('./model/model')

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
app.use(bodyParser.json())

const buildSearchWindowByUrlsObject = body => {
  return {
    $and: [
      {
        tabs: { $size: body.length }
      },
      {
        "tabs.url": { $all: body }
      }
    ]
  }
}

app
  //get all windows
  .get('/windows', (req, res, next) => {
    console.log('\nRequested all windows through "get/windows"')

    WindowsModel.find({})
      .then(resp => {
        console.log('Found all windows in db', resp)

        res.json(resp)
      })
      .catch(err => {
        console.error(`Error when trying to respond to "get/windows":\n${err}`)
      })
  })
  //find window with current tabs
  .get('/windowByURLs', (req, res, next) => {
    console.log('\nRequested window with tabs with URLs', req.body)

    WindowsModel.find(buildSearchWindowByUrlsObject(req.body))
      .then(resp => {
        console.log('found window')

        res.status(200)
        res.send("Found window")
      })
      .catch(err => {
        console.error('Not found window')

        res.status(404)
        res.send('Not found window')
      })
  })

app
  //new window
  .post('/window', (req, res, next) => {
    console.log('\nPosted new window ', req.body)

    WindowsModel.create(req.body)
      .then(resp => {
        console.log('Created new window')

        res.status(201)
        res.send('Stored new window')
      })
      .catch(err => {
        console.error(`Error when trying to create new window in "post/window":\n${err}`)
      })
  })
  //new tab from window
  .post('/tab', async (req, res, next) => {
    console.log('\nPosted new tab ', req.body)

    let foundWindows = await WindowsModel.find(req.query)
    console.log('found windows ', foundWindows)
    if (foundWindows.length === 0) {
      console.log('No window found with the given parameters')

      res.status(404)
      res.send('No window found with the given parameters')
    } else if (foundWindows.length > 1) {
      console.error('Found multiple windows with given criteria')

      res.status(400)
      res.send(`Found multiple windows with given criteria`)
    } else {
      console.log('windows found')

      foundWindows[0].tabs.push(req.body)
      console.log(foundWindows[0].tabs)

      foundWindows[0].save()
        .then(resp => {
          console.log('saved updated window')

          res.status(201)
          res.send(`Stored tab in window\n${JSON.stringify(foundWindows[0], null, 4)}`)
        })
        .catch(err => {
          console.log('error saving updated window: ', err)

          res.status(500)
          res.send(`Error saving updated window:\n\n${err}`)
        })
    }
  })




app.listen(3000, () => {
  console.log('Server started at port 3000')
})