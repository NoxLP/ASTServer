const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/SaveTabs', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
  .then(() => {
    console.log('Connected to Mongo!');
  }).catch(err => {
    console.error('Error connecting to mongo!', err);
  })
mongoose.Schema.Types.String.checkRequired(v => v != null);

const WindowsModel = require('./model/model')

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
app.use(cors())

const TransactionsQueue = require('./BDTransactionsQueue');
const { transactionsQueue } = require('./BDTransactionsQueue');
const { json } = require('body-parser');

//#region helpers
const resolveFindWindow = (res, foundWindows, okCallback) => {
  console.log(foundWindows.map(x => x.currentChromeId).join('\n'))
  if (foundWindows.length === 0) {
    console.log('No window found with the given parameters')

    res.status(404).send('No window found with the given parameters')
  } else if (foundWindows.length > 1) {
    console.error('Found multiple windows with given criteria')

    res.status(400).send(`Found multiple windows with given criteria`)
  } else {
    okCallback()
  }
}
const resolveFindTabInWindow = (res, myWindow, tabId, okCallback) => {
  let tabIndex;
  //console.log(myWindow.tabs)
  console.log(tabId)
  for (let i = 0; i < myWindow.tabs.length; i++) {
    console.log("\n" + myWindow.tabs[i].tabId)
    if (myWindow.tabs[i].tabId === tabId)
      console.log("\n*************** OK")
  }
  if ((tabIndex = myWindow.tabs.findIndex(x => x.tabId === tabId)) === -1) {
    console.error('No tab found with the given parameters: ', tabId)

    res.status(404)
    res.send(`No tab found with the given parameters: ${tabId}`)
  } else {
    okCallback(tabIndex)
  }
}
//#endregion

//#region GET
//**************************************************************
//  GET
//**************************************************************

app
  //get all windows
  .get('/windows', (req, res, next) => {
    console.log('\nRequested all windows through "get/windows"')

    TransactionsQueue.addTransaction(() =>
      WindowsModel.find({})
        .then(resp => {
          console.log('Found all windows in db', resp)

          res.json(resp)
        })
        .catch(err => {
          console.error(`Error when trying to respond to "get/windows":\n${err}`)
        })
    )
  })
  //get window
  .get('/window', (req, res, next) => {
    console.log('\nRequested window with chrome id', req.query)

    TransactionsQueue.addTransaction(() =>
      WindowsModel.find(req.query)
        .then(resp => {
          console.log('found window ', resp)

          res.status(200)
          res.json(resp)
        })
        .catch(err => {
          console.error('Not found window')

          res.status(404)
          res.send('Not found window')
        })
    )
  })
//#endregion

//#region POST
//**************************************************************
//  POST
//**************************************************************

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
    resolveFindWindow(res, foundWindows, () => {
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
    })
  })
  /*
  find window with current tabs => this endpoint use POST verb because all the urls of all tabs of the window are needed, they could just exceed the url max length so they can 
  NOT be passed as query params, therefore the body is needed to pass all tab's urls as an object and axios doesn't allow body in GET requests
  */
  .post('/windowByURLs', async (req, res, next) => {
    console.log('\nRequested window with tabs with URLs', req.body)

    TransactionsQueue.addTransaction(async () => {
      let foundWindows = await WindowsModel.find(req.body)
      console.log('found windows ', foundWindows)
      resolveFindWindow(res, foundWindows, () => {
        console.log('found window ', foundWindows[0])

        res.status(200)
        res.json(foundWindows[0])
      })
    })
  })
  /*
  get tabs by their ids => this endpoint use POST verb because the ids of all the tabs are needed, they could just exceed the url max length so they can 
  NOT be passed as query params, therefore the body is needed to pass all tab's urls as an object and axios doesn't allow body in GET requests
  */
  .post('/tabsByIds', (req, res, next) => {
    console.log('\nRequested tabs by ids', req.body)

    TransactionsQueue.addTransaction(() => {
      let ids = JSON.stringify(req.body)
      console.log(ids)
      WindowsModel.aggregate()
        .match({ 'tabs.tabId': { '$in': req.body } })
        .unwind('$tabs')
        .match({ 'tabs.tabId': { '$in': req.body } })
        .group({_id:'', 'tabs': { '$push': '$tabs' }})
        .then(resp => {
          console.log('done tabs by ids: ', resp)

          res.json(resp[0].tabs)
        })
        .catch(err => {
          console.log('error retrieving tabs by ids: ', err)

          res.status(500)
          res.send(`error retrieving tabs by ids: ${err}`)
        })
    })
  })
//#endregion

//#region patch
//**************************************************************
//  PATCH
//**************************************************************
app
  //update tab from window
  .patch('/tab', async (req, res, next) => {
    console.log('\nRequested update tab', req.query)

    TransactionsQueue.addTransaction(async () => {
      let foundWindows = await WindowsModel.find(req.query)
      console.log('found windows ', foundWindows)
      //res.json(foundWindows)
      resolveFindWindow(res, foundWindows, () => {
        let myWindow = foundWindows[0]
        resolveFindTabInWindow(res, myWindow, parseInt(req.body[0]), tabIndex => {
          console.log('Updating tab')

          let tab = myWindow.tabs[tabIndex]
          let updateObject = req.body[1];
          for (let prop in updateObject) {
            tab[prop] = updateObject[prop]
          }

          myWindow.save()
          res.sendStatus(200)
        })
      })
    })
  })
  //PATCH window chrome id
  .patch('/windowChromeId', (req, res, next) => {
    console.log('\nRequested update window chrome id')

    TransactionsQueue.addTransaction(() =>
      WindowsModel.findOneAndUpdate(req.query._id, req.body)
        .then(resp => {
          console.log('Updated chrome id')

          res.sendStatus(200)
        })
        .catch(err => {
          console.log(`Error updating window chrome id:\n${err}`)

          res.status(400)
          res.send(`Error updating window chrome id:\n${err}`)
        })
    )
  })
  //PATCH all window tabs ids
  .patch('/tabsIds', async (req, res, next) => {
    console.log("\nRequested update all window's tabs", req.query)

    TransactionsQueue.addTransaction(async () => {
      let foundWindows = await WindowsModel.find(req.query)
      console.log('found windows ', foundWindows)

      resolveFindWindow(res, foundWindows, () => {
        console.log('window found')

        let notFoundTabs = [], myWindow = foundWindows[0]

        for (let prop in req.body) {
          let tabIndex;
          if ((tabIndex = myWindow.tabs.findIndex(x => x.tabId === prop)) !== -1)
            myWindow.tabs[tabIndex].tabId = req.body[prop]
          else
            notFoundTabs.push(prop)
        }

        if (notFoundTabs.length === 0) {
          res.sendStatus(200)
        } else {
          res.status(200)
          res.json({ 'notFoundTabs': notFoundTabs })
        }
      })
    })
  })
  //PATCH window title
  .patch('/windowTitle', (req, res, next) => {
    console.log('\nRequested update window title', req.query)

    TransactionsQueue.addTransaction(() =>
      WindowsModel.findOneAndUpdate(req.query, req.body)
        .then(resp => {
          console.log('Updated window title')

          res.sendStatus(200)
        })
        .catch(err => {
          console.log(`Error updating window title:\n${err}`)

          res.status(400)
          res.send(`Error updating window title:\n${err}`)
        })
    )
  })
//#endregion

//#region delete
//**************************************************************
//  DELETE
//**************************************************************
app
  //DELETE tab from window
  .delete('/tab', async (req, res, next) => {
    console.log('\nRequested delete tab', req.query)

    TransactionsQueue.addTransaction(async () => {
      let foundWindows = await WindowsModel.find({ currentChromeId: req.query.currentChromeId })
      //console.log('found windows ', foundWindows)
      //res.json(foundWindows)
      resolveFindWindow(res, foundWindows, () => {
        console.log('found window')
        let myWindow = foundWindows[0]
        resolveFindTabInWindow(res, myWindow, parseInt(req.query.tabId), tabIndex => {
          console.log('deleting tab')
          myWindow.tabs.splice(tabIndex, 1)
          myWindow.save()

          res.sendStatus(200)
        })
      })
    })
  })
  //DELETE window
  .delete('/window', (req, res, next) => {
    console.log('\nRequested delete window', req.query)

    TransactionsQueue.addTransaction(() =>
      WindowsModel.deleteOne(req.query)
        .then(resp => {
          console.log('Window removed')

          res.sendStatus(200)
        })
        .catch(err => {
          console.log(`Error removing window:\n${err}`)

          res.status(400)
          res.send(`Error removing window:\n${err}`)
        })
    )
  })
//#endregion

app.listen(3000, () => {
  console.log('Server started at port 3000')
})