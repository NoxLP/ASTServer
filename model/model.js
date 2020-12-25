const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tabSchema = new Schema({
  url: {type: String, required: true},
  tabId: {type: Number, required: true},
  title: {type: String, required: true},
  muted: {type: Boolean, required: true},
  pinned: {type: Boolean, required: true},
  selected: {type: Boolean, required: true}
})
const windowSchema = new Schema({
  tabs: {type: [tabSchema], required: true},
  currentChromeId: {type: String, required: true},
  creationDate: {type: Date, required: true}
})

const WindowsModel = mongoose.model('windows', windowSchema)
module.exports = WindowsModel