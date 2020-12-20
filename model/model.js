const mongoose = require('mongoose')
const Schema = mongoose.Schema

/*
this.url = chromeTab.url;
      this.tabId = chromeTab.id;
      this.muted = chromeTab.mutedInfo.muted || false;
      this.pinned = chromeTab.pinned;
      this.selected = chromeTab.selected;
      this.title = chromeTab.title;
*/
const tabSchema = new Schema({
  url: {type: String, required: true},
  tabId: {type: String, required: true},
  title: {type: String, required: true},
  muted: {type: Boolean, required: true},
  pinned: {type: Boolean, required: true},
  selected: {type: Boolean, required: true}
})
const windowSchema = new Schema({
  tabs: {type: [tabSchema], required: true},
  currentChromeId: {type: String, required: true}
})

const WindowsModel = mongoose.model('WindowsModel', windowSchema)
module.exports = WindowsModel