const User = require('../model/userSchema')
const nodemailer = require('nodemailer')
const Banner = require('../model/bannerSchema')
const dotenv = require('dotenv')
dotenv.config()
const Product = require('../model/productSchema')
const { format } = require('date-fns')
const bcrypt = require('bcrypt')
const toastr = require('toastr')


const generateOtp = () => {
    try {
        let otp = ''
        for (let i = 0; i < 6; i++) {
            otp += Math.floor(Math.random() * 10)
        }
        return otp
    } catch (error) {
        console.log(error.message);
    }
}
const loadLogin = async (req, res) => {
    try {
        let bannerData = await Banner.aggregate([{$match:{is_unlisted:false}},{ $sample: { size: 1 } }])
        const productData = await Product.aggregate([{ $sample: { size: 8 } }])
        let user;
        if (req.session.user) {
            user = req.session.user.username
        }
        res.render('index', { username: user, bannerData: bannerData[0], products: productData })
    } catch (error) {
        console.log(error.message);
    }
}
const loadHome = async (req, res) => {
    try {
        let bannerData = await Banner.aggregate([{$match:{is_unlisted:false}},{ $sample: { size: 1 } }])
        const productData = await Product.aggregate([{ $sample: { size: 8 } }])
        let user;
        if (req.session.user) {
            user = req.session.user.username
        }
        res.render('index', { username: user, products: productData, bannerData: bannerData[0] })
    } catch (error) {
        console.log(error.message);
    }
}
const loadRegister = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log(error.message);
    }
}
const getBanner = async (req, res) => {
    try {
        const count = await Banner.find({is_unlisted:false}).count()
        let n = Math.floor(Math.random() * count)
        const bannerData = await Banner.findOne({is_unlisted:false}).skip(n)
        console.log(bannerData);
        if (bannerData) {
            res.json({ bannerData })
        }
        else {
            res.json({ bannerData: false })
        }
    } catch (error) {
        console.log(error.message);
    }
}
const verifyUser = async (req, res) => {
    try {
        req.session.email = req.body.email
        const userData = await User.findOne({ email: req.body.email })
        if (userData) {
            let isMatch = await encrypt(req.body.password, true, userData.password)
            console.log(isMatch);
            if (isMatch) {
                if (userData.is_verified) {
                    if (!userData.is_blocked) {
                        req.session.user = { email: userData.email, username: userData.username, id: userData._id }
                        if (req.query.redirect) {
                            res.redirect(req.query.redirect)
                        }
                        else {
                            res.redirect('/')
                        }
                    }
                    else {
                        res.render('login', { message: "You have been banned" })
                    }
                }
                else {
                    const otp = generateOtp()
                    const userData = await User.findOneAndUpdate({ email: req.session.email }, { $set: { 'auth.otp.value': otp, createdAt: Date.now() } })
                    const message = 'GadgetZone otp to verify your identity : ' + otp
                    await sendMail(userData.email, message)
                    res.render('otpPage', { message: "Otp send success",success:true })
                }
            }
            else {
                res.render('login', { message: "Invalid details" })
            }
        } else {
            res.render('login', { message: "User not found!" })
        }
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const logoutUser = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
}
const verifyOtp = async (req, res) => {
    try {
        const otpData = await User.findOne({ email: req.session.email })
        if (req.body.otp == otpData.auth.otp.value) {
            const userData = await User.findOneAndUpdate({ email: req.session.email }, { $set: { 'auth.otp': {}, is_verified: true } })
            if (userData) {
                req.session.user = { username: userData.username }
                res.redirect('/')
            }
        }
        else {
            res.render('otpPage', { message: 'Something went wrong' })
        }
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const saveuser = async (req, res) => {
    try {
        let currentDate = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        const password = await encrypt(req.body.password, false, null)
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            phone: req.body.phone,
            password: password,
            createdAt: currentDate,
            is_admin: false,
            is_blocked: false,
            is_verified: false,
        })
        const usrSave = await user.save()
        if (usrSave) {
            req.session.email = req.body.email
            const otp = generateOtp()
            console.log(otp);
            let message = 'GadgetZone otp to verify your identity : ' + otp
            await sendMail(req.session.email, message)
            await User.findOneAndUpdate({ email: req.session.email }, { $set: { 'auth.otp.value': otp } })
            res.render('otpPage', { message: "Otp sent to the email",success:true })
        }
    } catch (error) {
        res.render('register', { message: 'user already exists' })
        console.log(error.message);
    }
}
const checkUsername = async (req, res) => {
    try {
        console.log(req.body);
        const userData = await User.findOne({ username: req.body.user })
        if (userData) {
            res.json({ isTaken: true })
        }
        else {
            res.json({ isTaken: false })
        }
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const loadForget = async (req, res) => {
    try {
        res.render('forgetPassword')
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
let token = '';
const sendForget = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email })
        if (userData) {
            const user = Buffer.from(req.body.email).toString('base64')
            let char = 'a1b2c3d4efg567hijklmno8pqrst8uvw9xy0z'
            for (let i = 0; i < 20; i++) {
                token += char[Math.floor(Math.random() * 20)]
            }
            let message = `Link to reset your password : http://${req.hostname}:${process.env.PORT}/changePass?token=${token}&&user=${user} <font color='red'><br>This link will expire in 3 minutes `
            await sendMail(req.body.email, message)
            await User.findOneAndUpdate({ email: req.body.email }, { $set: { auth: { 'token.value': token, createdAt: Date.now() } } })
        }
        res.render('forgetPassword', { message: "If the user exists link would be in inbox",warning:true })
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const loadChangepass = async (req, res) => {
    try {
        let email = Buffer.from(req.query.user, 'base64').toString()

        const userData = await User.findOne({ email: email })
        if (userData !== null) {
            const token = userData.auth.token.value
            if (req.query.token === token) {
                res.render('changePassword', { id: userData._id })
            }
            else {
                res.send('Signature verification failed')
            }
        }
        else {
            res.send('something went wrong')
        }
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const savePassword = async (req, res) => {
    try {
        const pass = req.body.password
        const con_pass = req.body.con_pass
        if (pass === con_pass) {
            const password = await encrypt(req.body.password, false, null)
            const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { password: password, auth: {} } })
            if (userData) {
                let reciever = userData.email
                let message = 'Alert : your gadgetzone account password was changed <br>if not done by you ? visit website'
                await sendMail(reciever, message)
                res.render('changePassword', { id: null, message: "Password has been changed",success:true })
            }
            else {
                res.render('changePassword', { id: null, message: "Something went wrong" })
            }
        }
        else {
            res.render('changePassword', { id: null, message: "Passwords are not match" })
        }
    } catch (error) {
        res.render('changePassword', { id: null, message: "Signature verification failed" })
        console.log(error.message);
    }
}

const encrypt = async (pass, isCompare, encPass) => {
    try {
        console.log(pass);
        const passData = await bcrypt.hash(pass, 10)
        if (passData) {
            if (isCompare) {
                if (await bcrypt.compare(pass, encPass)) {
                    return true
                }
                else {
                    return false
                }
            }
            else {
                return passData
            }
        }
        return null
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);

    }
}
const sendMail = async (reciever, message) => {
    try {
        email = reciever
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.MAILER,
                pass: process.env.MAIL_PASS
            }
        })
        const options = {
            from: process.env.MAILER,
            to: reciever,
            subject: 'no-reply@gadgetZone.com',
            html: message
        }
        console.log(options.html);
        transporter.sendMail(options, async function (error, info) {
            if (error) {
                console.log(error);
            } else {

                console.log('mail send')
            }
        }
        )
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const loadProfile = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.session.email })
        userData.password
        res.render('profile', { userData, username: userData.username })
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const editUser = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.query.id })
        res.render('editUser', { userData })
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const changePass = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.session.user.email })
        console.log(userData);
        res.render('changePassPage', { id: userData._id ,username:req.session.user.username})
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}

const saveChangePassword = async (req, res) => {
    try {
        const pass = req.body.password
        const con_pass = req.body.con_pass
        if (pass === con_pass) {
            const password = await encrypt(req.body.password, false, null)
            const userData = await User.findOneAndUpdate({ email:req.session.user.email }, { $set: { password: password, auth: {} } })
            if (userData) {
                let reciever = userData.email
                let message = 'Alert : your gadgetzone account password was changed <br>if not done by you ? visit website'
                await sendMail(reciever, message)
                res.render('changePassPage', { id: null, message: "Password has been changed",success:true })
            }
            else {
                res.render('changePassPage', { id: null, message: "Something went wrong" })
            }
        }
        else {
            res.render('changePassPage', { id: null, message: "Passwords are not match" })
        }
    } catch (error) {
        res.render('changePassPage', { id: null, message: "Signature verification failed" })
        console.log(error.message);
    }
}
const saveUsername = async(req,res)=>{
    try {
        const userData = await User.findOneAndUpdate({email:req.session.user.email},{$set:{username:req.body.username}})
        res.json({success:true})
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
const saveEditedUser =async(req,res)=>{
    try {
        console.log(req.body.username,req.body.email,req.body.phone);

        const userData = await User.findByIdAndUpdate({_id:req.query.id},{$set:{username:req.body.username,email:req.body.email,phone:req.body.phone}})
        if(!userData){
            throw new Error('Something went wrong')
        }else{
            res.redirect('/admin/users')
        }
    } catch (error) {
        res.status(500)
        res.render('error',{message:error,code:500})
        console.log(error.message);
    }
}
module.exports = {
    loadLogin,
    loadHome,
    verifyUser,
    logoutUser,
    loadRegister,
    verifyOtp,
    saveuser,
    checkUsername,
    loadForget,
    sendForget,
    loadChangepass,
    savePassword,
    loadProfile,
    editUser,
    getBanner,
    saveEditedUser,
    changePass,
    saveChangePassword,
    saveUsername,
    sendMail,
    generateOtp
}