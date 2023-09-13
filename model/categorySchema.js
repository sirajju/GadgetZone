const mongoose = require('mongoose')

const category = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    is_unlisted:{
        type:Boolean,
        default:false,
    }
})

const Category = mongoose.model('Category',category)

module.exports = Category