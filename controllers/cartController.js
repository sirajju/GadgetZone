const User = require('../model/userSchema')
const Product = require('../model/productSchema')

const addToCart = async (req, res) => {
    try {
        const product = await Product.findById({_id:req.body.id})
        const isExists = await User.aggregate([{$match:{email:req.session.user.email}},{$unwind:"$cart"},{$group:{_id:{productId:"$cart.productId",quantity:"$cart.Quantity"}}},{$match:{'_id.productId':product._id}}])
        const cartData = {
            productId:product._id,
            productName:product.name,
            productImage:product.image[0],
            Quantity:1,
            price:product.price
        }
        if(isExists.length){
            if(req.body.action=='inc'){
                cartData.Quantity = isExists[0]._id.quantity+1
                cartData.price = product.price*cartData.Quantity
                const cartUpdate = await User.findOneAndUpdate({email:req.session.user.email,'cart.productId':product._id},{$set:{'cart.$.Quantity':cartData.Quantity,'cart.$.price':cartData.price}})            
                if(cartUpdate){
                    res.json({done:true,n:cartData})
                }
                else{
                    console.log('something went wrong');
                }
            }
            else if (req.body.action=='dec'){
                if(isExists[0]._id.quantity<=1){
                    await User.findOneAndUpdate({email:req.session.user.email},{$pull:{cart:{productId:product._id}}})
                    res.json({delete:true})
                }
                else{
                    cartData.Quantity = isExists[0]._id.quantity-1
                    cartData.price = cartData.Quantity*product.price
                    await User.findOneAndUpdate({email:req.session.user.email,'cart.productId':product._id},{$set:{'cart.$.price':cartData.price,'cart.$.Quantity':cartData.Quantity}})
                    res.json({done:true,n:cartData})
                }
            }
        }
        else{
            await User.findOneAndUpdate({email:req.session.user.email},{$push:{cart:cartData}})
            res.json({success:true})
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadCart = async (req, res) => {
    try {
        let a=[]
        let cartData = await User.aggregate([{ $match: { email: req.session.user.email } }, { $unwind: '$cart' }, { $group: { _id: "$cart" } }])
        if(req.query.search){
            cartData.forEach((product)=>{
                if(product._id.productName==req.query.search){
                    cartData.length=0
                   cartData[0] = product
                }
            })
        }
        res.render('cart', { username: req.session.user.username, cartData: cartData,search:req.query.search })
    } catch (error) {
        console.log(error.message);
    }
}
const removeFromCart = async (req, res) => {
    try {
        const cartData = await User.findOneAndUpdate({ email: req.session.user.email }, { $pull: { cart: { productId: req.body.id } } })
        if (cartData) {
            res.json({ success: true })
        }
        else {
            res.json({ success: false })
        }
    } catch (error) {
        res.json({ success: false })
        console.log(error.message);
    }
}
module.exports = {
    addToCart,
    loadCart,
    removeFromCart
}