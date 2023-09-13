const mongoose = require('mongoose')

const trash = new mongoose.Schema({
    date:{type:Date,require:true},
    type:{type:String},
    admin:{type:String,require:true},
    identity:{type:String,require:true},
    trashedData:{type:Array,default:[]}
})

const Trash = mongoose.model('Trashed',trash)

module.exports = Trash