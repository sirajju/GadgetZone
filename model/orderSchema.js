const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    userName:{
        type:String,
        required:true
    },
    address:{type:Array,default:[]},
    products:{type:Array,default:[]},
    totalAmount:{
        type:Number,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    paymentMethod:{
        type:String,
        required:true
    },
    paymentStatus:{
        type:String,
        required:true
    },
    paymentId:{
        type:String
    },
    date:{
        type:Date
    },
    orderStatus:{
        type:String
    },
},
{timestamps:true}
)

const Order = mongoose.model("Order",orderSchema);
module.exports = Order;