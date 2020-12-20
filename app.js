const express = require('express')
const app = express()
const mongoose = require('mongoose')
const WindowsModel = require('./model/model')

app
  .get('/windows', (req, res, next) => {
    
  })