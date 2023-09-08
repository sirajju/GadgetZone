const mongoose = require('mongoose')

const address = new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    name:String,
    state:String,
    pin:Number,
    category:String,
    phone:Number,
    locality:String,
    address:String,
    city:String
})

const Address = mongoose.model('Address',address)

module.exports = Address