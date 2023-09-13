const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone:{
      type:String,
      required:true
    },
    password: {
      type: String,
      required: true,
    },
    createdAt :{
      type:Date,
      default:Date.now(),
      required:true
    },
    is_admin:{
      type:Boolean,
      required:true,
      defaul:false
    },
    is_blocked:{
      type:Boolean,
      default:false,
      required:true
    },
    is_verified:{
      type:Boolean,
      default:false,
      required:true
    },
    address:{
      type:Array,
    },
    wallet:{
      type:Number,
      default:0,
      require:true
    },
    walletHistory :{
      type:Array,
      default:[],
    },
    auth:{
      token:{
        value :{
          type:String,
          default:null,
        },
        createdAt:{
          type:Date,
          default:Date.now()
        }
      },
      otp:{
        value :{
          type:String,
          default:null,
        },
        createdAt:{
          type:Date,
          default:Date.now()
        }
      }
    },
    wishlist:[
      {
        productId:String,
      }
    ],
    cart:[
      {
        productId:mongoose.Schema.Types.ObjectId,
        productImage:String,
        productName:String,
        Quantity:Number,
        price:Number
      }
    ],
    orders:[
      {
        orderDate:Date,
        products:[],
        amount:Number,
        discount:String,
        totalAmount:Number,
        address:String,
        paymentMethod:String,
        paymentStatus:String,
      }
    ]
  });

  const User = mongoose.model('User', userSchema);

  module.exports = User;