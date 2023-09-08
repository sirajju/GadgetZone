const Coupon = require('../model/couponSchema')
const Order = require('../model/orderSchema')
const Product = require('../model/productSchema')
const User = require('../model/userSchema')
const { format } = require('date-fns')
const Razorpay = require('razorpay');
const Address = require('../model/addressSchema')

const placeOrder = async (req, res) => {
    try {
        const productData = await User.aggregate([{ $match: { email: req.session.user.email } }, { $unwind: "$cart" }, { $group: { _id: { productId: '$cart.productId', productName: "$cart.productName", count: '$cart.Quantity', price: "$cart.price", productImage: "$cart.productImage" } } }])
        const addressData = await Address.findOne({ email: req.session.user.email, category: req.body.address })
        let currentDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        const userData = await User.findOne({ email: req.session.user.email })
        const order = new Order({
            userId: userData._id,
            userName: userData.username,
            date: currentDate,
            products: productData,
            amount: parseInt(req.body.amount),
            discount: parseInt(req.body.discount),
            totalAmount: parseInt(req.body.total),
            address: addressData,
            paymentMethod: req.body.payment,
            paymentStatus: 'pending',
            orderStatus: req.body.payment == 'ONLINE' ? 'pending' : "placed"
        })
        const orderData = await order.save()
        order.orderId = orderData._id
        const isExists = await Order.find({ userName: req.session.user.username })

        if (orderData.paymentMethod == 'COD') {
            const productData = await User.aggregate([{ $match: { email: req.session.user.email } }, { $unwind: "$cart" }, { $group: { _id: { productId: '$cart.productId', productName: "$cart.productName", count: '$cart.Quantity', price: "$cart.price" } } }])
            productData.forEach(async (each) => {
                await Product.findByIdAndUpdate({ _id: each._id.productId }, { $inc: { stock: -(each._id.count) } })
            })
            await User.findOneAndUpdate({ email: req.session.user.email }, { $unset: { cart: [] } })
            await Coupon.findOneAndUpdate({ name: req.body.coupon }, { $pull: { users: { email: req.session.user.email } } })
            await Coupon.findOneAndUpdate({ name: req.body.coupon }, { $push: { users: { email: req.session.user.email, is_used: true } } })
            res.json({ cod: true })
        }
        if (orderData.paymentMethod == 'WALLET') {
            const userData = await User.findOne({ email: req.session.user.email })
            if (userData.wallet >= orderData.totalAmount) {
                const productData = await User.aggregate([{ $match: { email: req.session.user.email } }, { $unwind: "$cart" }, { $group: { _id: { productId: '$cart.productId', productName: "$cart.productName", count: '$cart.Quantity', price: "$cart.price" } } }])
                productData.forEach(async (each) => {
                    await Product.findByIdAndUpdate({ _id: each._id.productId }, { $inc: { stock: -(each._id.count) } })
                })
                await Order.findByIdAndUpdate({ _id: order.orderId }, { $set: { paymentStatus: 'recieved', orderStatus: 'placed' } })
                await User.findOneAndUpdate({ email: req.session.user.email }, { $inc: { wallet: -orderData.totalAmount } })
                const transaction = {
                    amount: orderData.totalAmount,
                    transaction: "Debited",
                    date: Date.now()
                }
                await User.findOneAndUpdate({ email: req.session.user.email }, { $push: { walletHistory: transaction } })
                await User.findOneAndUpdate({ email: req.session.user.email }, { $unset: { cart: [] } })
                await Coupon.findOneAndUpdate({ name: req.body.coupon }, { $pull: { users: { email: req.session.user.email } } })
                await Coupon.findOneAndUpdate({ name: req.body.coupon }, { $push: { users: { email: req.session.user.email, is_used: true } } })
                res.json({ wallet: true })
            } else {
                res.json({ walletError: true })
            }
        }
        else {
            var instance = new Razorpay({
                key_id: 'rzp_test_TjaRzg9ObZY8lv',
                key_secret: 'nATaCucOTadnA70lsd8xVfgZ',
            });
            const options = {
                amount: req.body.total * 100,
                currency: "INR",
                receipt: "" + order.orderId,
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    res.json({ order });
                }
            })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const verifyPayment = async (req, res) => {
    try {
        if (req.body['payment[razorpay_payment_id]']) {
            const productData = await User.aggregate([{ $match: { email: req.session.user.email } }, { $unwind: "$cart" }, { $group: { _id: { productId: '$cart.productId', productName: "$cart.productName", count: '$cart.Quantity', price: "$cart.price" } } }])
            productData.forEach(async (each) => {
                await Product.findByIdAndUpdate({ _id: each._id.productId }, { $inc: { stock: -(each._id.count) } })
            })
            await Order.findByIdAndUpdate({ _id: req.body['order[receipt]'] }, { $set: { paymentStatus: 'recieved', orderStatus: 'placed', paymentId: req.body['payment[razorpay_payment_id]'] } })
            await User.updateOne({ email: req.session.user.email }, { $unset: { cart: [] } })
            await Coupon.updateOne({ name: req.body.coupon }, { $pull: { users: { email: req.session.user.email } } })
            await Coupon.updateOne({ name: req.body.coupon }, { $push: { users: { email: req.session.user.email, is_used: true } } })
            res.json({ success: true })
        }
        else {
            res.json({ success: false })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const orderSuccess = async (req, res) => {
    res.render('orderSuccess', { username: req.session.user.username })
}
const loadMyOrders = async (req, res) => {
    try {
        let dates = []
        const orderData = await Order.find({ userName: req.session.user.username })
        for (let i = 0; i < orderData.length; i++) {
            let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Sep', 'Oct', 'Nov', 'Dec']
            dates[i] = months[new Date(orderData[i].date).getMonth() - 1] + ' ' + new Date(orderData[i].date).getDate() + ' ' + dayNames[new Date(orderData[i].date).getDay()] + ' ' + new Date(orderData[i].date).getFullYear()
            const orderDate = new Date(orderData[i].date)
            orderData[i].arrive = orderDate.setDate(orderDate.getDate() + 5)
            const today = new Date().getTime()
            if (orderData[i].arrive <= today || orderData[i].orderStatus=='delivered') {
                
                orderData[i].paymentStatus = 'recieved'
                orderData[i].orderStatus = 'Delivered'
                orderData[i].arrive = 'Arrived'
                await Order.findByIdAndUpdate({ _id:orderData[i]._id },{$set:{paymentStatus : 'recieved' , orderStatus:'delivered'}})
            }
        }
        res.render('myOrders', { orderData: orderData, username: req.session.user.username, dates })
    } catch (error) {
        console.log(error);
    }
}
const cancellOrder = async (req, res) => {
    try {
        const productData = await Order.findOne({ userName: req.session.user.username })

        for (let i = 0; i < productData.products.length; i++) {
            const a = await Product.findByIdAndUpdate({ _id: productData.products[i]._id.productId }, { $inc: { stock: productData.products[i]._id.count } })
            console.log(a);
        }
        console.log(productData);
        if (productData.paymentMethod == 'ONLINE' || productData.paymentMethod == 'WALLET') {
            const transaction = {
                amount: productData.totalAmount,
                transaction: "Credited",
                date: Date.now()
            }
            await User.findOneAndUpdate({ email: req.session.user.email }, { $push: { walletHistory: transaction } })
            await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { orderStatus: 'cancelled', paymentStatus: 'refunded' } })
            await User.findOneAndUpdate({ email: req.session.user.email }, { $inc: { wallet: productData.totalAmount } })
        }

        else {
            await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { orderStatus: 'cancelled', paymentStatus: 'cancelled' } })
        }
        res.redirect('/orders')
    } catch (error) {
        res.redirect('/orders')
        console.log(error.message);
    }
}

module.exports = {
    placeOrder,
    verifyPayment,
    orderSuccess,
    loadMyOrders,
    cancellOrder
}