const User = require('../model/userSchema')
const Address = require('../model/addressSchema')

const loadAddAddress = async(req,res)=>{
    try {
        const categoryData = new Set(['Home','Work','Extra'])
        const addressData = await Address.aggregate([{$match:{email:req.session.user.email}},{$group:{_id:"$category"}}])
        let i=1;
        if(addressData.length){
            addressData.forEach((name)=>{
                if(categoryData.has(name._id)){
                    categoryData.delete(name._id)
                }
                i++
            })
        }
        console.log(categoryData,i);
        if(i>3){
            categoryData.add('Extra_'+(i-2))
        }
        res.render('addAddress',{categoryData})
    } catch (error) {
        console.log(error.message);
    }
}
const saveAddress = async(req,res)=>{
    try {
        const addressData =new Address({
            email:req.session.user.email,
            userId:req.session.user.userId,
            name:req.body.name,
            state:req.body.state,
            pin:parseInt(req.body.pincode),
            category:req.body.category,
            phone:req.body.phone,
            locality:req.body.locality,
            address:req.body.address,
            city:req.body.city,

        })
        const address = await addressData.save()
        if(addressData){
            res.redirect('/checkout')
        }
    } catch (error) {
        res.send('<script>alert("Something went wrong!");window.history.back()</script>')
        console.log(error.message);
    }
}
const resaveAddress = async(req,res)=>{
    try {
        const addressData = {
            name:req.body.name,
            state:req.body.state,
            pin:parseInt(req.body.pincode),
            phone:req.body.phone,
            locality:req.body.locality,
            address:req.body.address,
            city:req.body.city,
            category:req.query.name

        }
        const push = await Address.findOneAndUpdate({email:req.session.user.email,category:req.query.name},{$set:addressData})
        if(push){
            res.redirect('/checkout')
        }
    } catch (error) {
        console.log(error.message);
    }
}
const loadEditAddress =async(req,res)=>{
    try {
        const addressData = await Address.findOne({email:req.session.user.email,category:req.query.name})
        if(!addressData){
        res.send('<script>alert("Adress not found!");window.history.back()</script>')
        }
        res.render('editAddress',{addressData:addressData})
    } catch (error) {
        console.log(error.message);
    }
}
const loadViewAddress =async(req,res)=>{
    try {
        const addressData = await Address.findOne({email:req.session.user.email,category:req.query.name})
        if(!addressData){
        res.send('<script>alert("Adress not found!");window.history.back()</script>')
        }
        res.render('viewAddress',{addressData:addressData})
    } catch (error) {
        console.log(error.message);
    }
}
const deleteAddress = async(req,res)=>{
    try {
        const addressData = await Address.findOneAndDelete({email:req.session.user.email,category:req.query.name})
        res.redirect('/checkout')
    } catch (error) {
        res.send('<script>alert("Adress not found!");window.history.back()</script>')
        console.log(error.message);
    }
}

module.exports = {
    loadAddAddress,
    saveAddress,
    loadEditAddress,
    deleteAddress,
    resaveAddress,
    loadViewAddress
}