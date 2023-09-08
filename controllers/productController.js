const Product = require('../model/productSchema')
const User = require('../model/userSchema')
const Coupon = require('../model/couponSchema')
const Category = require('../model/categorySchema')
const Order = require('../model/orderSchema')
const Address = require('../model/addressSchema')
const adminController = require('../controllers/adminController')

const showProduct = async (req, res) => {
    try {
        const product = await Product.findById({ _id: req.query.id })
        let cartData = await User.aggregate([{ $match: { email: req.session.user.email, 'cart.productId': product._id } }, { $unwind: '$cart' }, { $match: { 'cart.productId': product._id } }, { $group: { _id: '$cart.Quantity' } }])
        const isWished = await User.findOne({ email: req.session.user.email, wishlist: { $elemMatch: { productId: product._id } } }).count()
        let Quantity = 1
        let isExists = false;
        console.log(cartData);
        if (cartData.length) {
            Quantity = cartData[0]._id
            isExists = true
        }
        res.render('showProduct', { product, username: req.session.user.username, isExists, isWished, quantity: Quantity })
    } catch (error) {
        res.send('<script>alert("Something went wrong");window.history.back()</script>')
        console.log(error.message);
    }
}
const deleteProduct = async (req, res) => {
    try {
        console.log(req.query);
        const binData = await Product.findById({_id:req.query.id})
        const productData = await Product.findByIdAndDelete({ _id: req.query.id })
        if (productData) {
            adminController.putToBin('Product',binData,req.session.isAdmin)
            res.redirect('/admin/products')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadShop = async (req, res) => {
    try {
        let productData;
        const filter = req.query.price
        let price;
        let searchData;
        let page = 1;
        let search
        let totalPage = await Product.find({ isActive: true }).count() / 8
        if (req.query.search || filter) {

            if (filter) {
                if (filter == '0tok') {
                    price = { $lte: 1000 }
                }
                else if (filter == 'kto5k') {
                    price = { $gte: 1000, $lte: 5000 }
                } else if (filter == '5kto10k') {
                    price = { $gte: 5000, $lte: 10000 }
                } else if(filter =='All') {
                    price = {$ne:''}
                }else{
                    price = { $gte: 10000 }
                }
            }
            if (req.query.search) {
                searchData = req.query.search
                search = { $regex: new RegExp(`^${req.query.search}`, 'i') }
            }
            if (req.query.search && filter) {
                console.log('Fine');
                console.log(search,price);
                productData = await Product.find({ $or: [{ name: search }, { category: search }], price: price })
            }
            else if (filter && !req.query.search) {
                productData = await Product.find({ price: price })
            }
            else if (!filter && req.query.search) {
                search = { $regex: new RegExp(`^${req.query.search}`, 'i') }

                productData = await Product.find({ $or: [{ name: search }, { category: search }] })
            }
        } else {
            productData = await Product.aggregate([{$sample:{size:8}}])
        }
        let curr=1
        if (req.query.page) {
            curr=parseInt(req.query.page)
            page = req.query.page
            let limit = 8
            let skip = limit * (page - 1)
            console.log(skip);
            productData = await Product.find({ isActive: true }).skip(skip).limit(limit)
        }
        let user
        if (req.session.user) {
            user = req.session.user.username
        }
        const categoryData = await Category.find()
        res.render('shop', { username: user, productData, categoryData, search: searchData, totalPage ,curr})
    } catch (error) {
        console.log(error.message);
    }
}
const searchProduct = async (req, res) => {
    try {
        let totalPage;
        let curr = 1
        const query = { $regex: new RegExp(`^${req.body.name}`, 'i') }
        const searchData = await Product.find({ $or: [{ name: query }, { category: query }] })
        const categoryData = await Category.find()
        let user;
        if(req.session.user){
            user = req.session.user.username
        }
        res.render('shop', { productData: searchData, username: user, categoryData, totalPage,curr })
    } catch (error) {
        console.log(error.message);
    }
}
const deActivate = async (req, res) => {
    try {
        const productData = await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: { isActive: false } })
        if (productData) {
            res.redirect('/admin/products')
        }
        else {
            res.send('Product not found or something went wrong')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const activate = async (req, res) => {
    try {
        const productData = await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: { isActive: true } })
        if (productData) {
            res.redirect('/admin/products')
        }
        else {
            res.send('Product not found or something went wrong')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadCheckout = async (req, res) => {
    try {
        let discountPrice = 0
        const totalCoupons = await Coupon.find({disabled:false})
        const userData = await User.findOne({ email: req.session.user.email })
        const addressData = await Address.find({email:req.session.user.email})
        const cartData = await User.aggregate([{ $match: { email: userData.email } }, { $unwind: "$cart" }, { $group: { _id: null, total: { $sum: "$cart.price" } } }])
        const couponData = await Coupon.aggregate([{ $unwind: "$users" }, { $match: { users: { email: userData.email, is_used: false } ,disabled:false} }])
        if (couponData.length) {
            console.log(couponData[0].amount, cartData[0].total);
            discountPrice = Math.floor((couponData[0].amount / 100) * cartData[0].total)
            cartData[0].total = cartData[0].total - discountPrice
        }
        res.render('checkout', { username: req.session.user.username, userData, totalAmount: cartData[0].total, couponData, discountPrice, addressData,totalCoupons })
    } catch (error) {
        res.redirect('/orders')
        console.log(error.message);
    }
}
const viewProducts = async(req,res)=>{
    try {
        const orderData = await Order.findById({_id:req.query.id})
        console.log(orderData);
        res.render('viewProducts',{productData:orderData,username: req.session.user.username})
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    showProduct,
    deleteProduct,
    searchProduct,
    loadShop,
    deActivate,
    activate,
    loadCheckout,
    viewProducts

}