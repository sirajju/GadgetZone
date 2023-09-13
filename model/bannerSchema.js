const mongoose = require('mongoose');

const banner = new mongoose.Schema({
    name:{type:String,require:true,unique:true},
    image:{type:String,require:true},
    is_unlisted:{type:Boolean,require:true}
})

const Banner = mongoose.model('Banner',banner)

module.exports = Banner