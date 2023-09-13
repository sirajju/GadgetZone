const Coupon = require('../model/couponSchema')

const checkCoupon = async (req, res) => {
    try {
        const isExists = await Coupon.findOne({ name: req.body.name, users: { $elemMatch: { email: req.session.user.email, is_used: true } }, })
        if (!isExists) {
            const isFull = await Coupon.findOne({name:req.body.name})
            if(isFull){
                if(isFull.users.length>=isFull.maxUsers){
                    res.json({limit:true})
                    return false
                }
            }
            const couponData = await Coupon.findOneAndUpdate({ name: req.body.name }, { $push: { users: { email: req.session.user.email, is_used: false } } })
            if (couponData) {
                res.json({ isExists: couponData })
            } else {
                res.json({ isExists: false })
            }
        } else {
            res.json({ isUsed: true })
        }

    } catch (error) {
        console.log(error.message);
    }
}
const rmCoupon = async (req, res) => {
    try {
        const couponData = await Coupon.findByIdAndUpdate({ _id: req.query.id }, { $pull: { users: { email: req.session.user.email, is_used: false } } })
        res.redirect('/checkout')
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    checkCoupon,
    rmCoupon,
}