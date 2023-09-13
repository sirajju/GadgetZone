const mongoose = require('mongoose')

const coupon = new mongoose.Schema({
    name:{type:String,require:true,unique:true},
    amount:{type:Number,require:true},
    disabled:{type:Boolean,require:true},
    expireAt:{type:Date},
    validity:{type:String,default:'active'},
    maxUsers:{type:Number,default:0},
    createdAt :{type:Date,default:Date.now()},
    users:{
        type:Array,
        default:[]
    }
})
const Coupon = mongoose.model('Coupon',coupon)

module.exports=Coupon