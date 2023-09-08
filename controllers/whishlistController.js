const Product = require('../model/productSchema')
const User = require('../model/userSchema')

const addToWhishlist = async(req,res)=>{
    try {
        const productData = await Product.findById({_id:req.body.id})
        const isExists = await User.findOne({email:req.session.user.email,wishlist:{$elemMatch:{productId:productData._id}}})
        console.log(isExists);
        if(!isExists){
            const userData = await User.findOneAndUpdate({_id:req.session.user.id},{$push:{wishlist:{
                productId:productData._id
            }}})
            res.json({success:true})
        }
        else{
            res.json({success:false})
        }
    } catch (error) {
        console.log(error);
    }
}
const loadWishlist = async(req,res)=>{
    try {
        const Data = await User.aggregate([{$match:{email:req.session.user.email}},{$unwind:"$wishlist"},{$group:{_id:"$wishlist.productId"}}])
        let productData = []
        let i=0;
        console.log(Data.length);
        while(Data.length>i){
            productData[i] = await Product.findById({_id:Data[i]._id})
            i++
        }
        console.log(productData);
        res.render('wishlist',{username:req.session.user.username,productData})
    } catch (error) {
        console.log(error.message);
    }
}
const removeWishlist = async(req,res)=>{
    try {
        const wishlistData = await User.findOneAndUpdate({email:req.session.user.email},{$pull:{wishlist:{productId:req.body.id}}})
        if(wishlistData){
            res.json({success:true})
        }
        else{
            res.json({success:false})
        }
    } catch (error) {
        console.log(error.message);
    }
}

const searchProduct = async(req,res)=>{
    try {
        const query = {$regex:new RegExp(`^${req.body.name}`, 'i')}
        const productData= await Product.findOne({$or:[{name:query},{category:query}]})
        const searchData = await User.aggregate([{$match:{email:req.session.user.email}},{$unwind:"$wishlist"},{$group:{_id:'$wishlist.productId'}}])
        console.log(searchData);
        res.render('wishlist',{productData,username:req.session.user.username})
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    addToWhishlist,
    loadWishlist,
    removeWishlist,
    searchProduct
}