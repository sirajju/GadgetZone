const mongoose = require('mongoose')

const productSchama = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        default:0
    },
    image:{
        type:Array,
        required:true
    },
    discount:{
        type:Number,
    },
    isActive:{
        type:Boolean,
        default:true
    },
 
})
const Product = mongoose.model('Product',productSchama)

module.exports = Product