const mongoose = require('mongoose')

const logger = new mongoose.Schema({
    date:{type:Date,require:true},
    activity:{name:String,type:String},
    admin:{type:String,require:true},
    type:{type:String,require:true}
})

const Logger = mongoose.model('Loggers',logger)

module.exports = Logger