const User = require('../model/userSchema')
const Product = require('../model/productSchema')
const Category = require('../model/categorySchema')
const bcrypt = require('bcrypt')
const Banner = require('../model/bannerSchema')
const Coupon = require('../model/couponSchema')
const Order = require('../model/orderSchema')
const Logger = require('../model/loggerSchema')
const Trash = require('../model/trashSchema')
const userController = require('../controllers/userController')
const color = require('cli-color')
const sharp = require('sharp')
const path = require('path')
const exceljs = require('exceljs')
const Swal = require('sweetalert2')
const puppeteer = require('puppeteer')


const loadHome = async (req, res) => {
    try {
        res.render('adminHome')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const checkAdmin = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email, is_admin: true })
        if (userData) {
            const passMatch = await encrypt(req.body.password, true, userData.password)
            if (passMatch) {

                req.session.isAdmin = userData.email
                saveLog(`Admin logged with ${userData.email}`,'access', req.session.isAdmin)
                res.redirect('/admin')
            }
            else {
                res.render('adminLogin', { url: false, message: "incorrect Email or password" })
            }
        }
        else {
            res.render('adminLogin', { url: false, message: "incorrect Email or password" })
        }
    } catch (error) {
        error.message = 'Something went wrong'
        res.status(500)
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listUsers = async (req, res) => {
    try {
        let userData;
        if (req.query.search) {
            const query = { $regex: new RegExp(`^${req.query.search}`, 'i') }
            userData = await User.find({ $or: [{ username: query }, { email: query }] })
        } else {
            userData = await User.find({ is_admin: false })
        }
        res.render('listUsers', { userData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const logout = async (req, res) => {
    try {
        delete req.session.isAdmin
        delete req.session.access
        res.redirect('/admin')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listProducts = async (req, res) => {
    try {
        let productData;
        if (req.query.filter) {
            if (req.query.filter == 'false' || req.query.filter == 'true') {
                productData = await Product.find({ isActive: req.query.filter })
            } else {
                productData = await Product.find({ category: req.query.filter })
            }
        }
        else if (req.query.search) {
            const query = { $regex: new RegExp(`^${req.query.search}`, 'i') }
            productData = await Product.find({ name: query })
        }
        else {
            productData = await Product.find()
        }
        const categoryData = await Category.find()
        res.render('showProducts', { productData, categoryData })

    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const addProduct = async (req, res) => {
    try {
        const categoryData = await Category.find({})
        res.render('addProduct', { categoryData })
    } catch (error) {
        console.log(error);
    }
}
const saveProduct = async (req, res) => {
    try {
        let image = []
        for (let i = 0; i < req.files.length; i++) {
            const original = path.join(__dirname, '../public/assets/productImages' + req.files[i].filename)
            const modded = path.join(__dirname, '../public/assets/productImages' + req.files[i].filename)
            sharp(original).resize(351, 416, {
                fit: 'cover',
                position: 'center'
            }).toFile(modded, (err, info) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(info);
                }
            })
            image[i] = req.files[i].filename
        }
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            stock: req.body.stock,
            discount: req.body.discount,
            image: image

        })
        const productData = await product.save()
        saveLog(`Product ${productData._id} edited`,'updation', req.session.isAdmin)

        res.redirect('/admin/products')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const editProduct = async (req, res) => {
    try {
        const product = await Product.findById({ _id: req.query.id })
        const categoryData = await Category.find({})
        res.render('editProduct', { product, categoryData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const resaveProduct = async (req, res) => {
    try {
        console.log(req.files);
        let image = []
        for (let i = 0; i < req.files.length; i++) {
            const original = path.join(__dirname, '../public/assets/productImages/' + req.files[i].filename)
            const modded = path.join(__dirname, '../public/assets/productImages/size_fixed_' + req.files[i].filename)
            sharp(original).resize(351, 416, {
                fit: 'cover',
                position: 'center'
            }).toFile(modded, (err, info) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(info);
                }
            })
            image[i] = 'size_fixed_' + req.files[i].filename
        }
        const product = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            stock: req.body.stock,
            discount: req.body.discount,
            image: function () {
                if (req.body.isImageEdit == 'on') {
                    this.image = image
                }
                else {
                    delete this.image
                }
            }
        }
        product.image()
        const productData = await Product.findByIdAndUpdate({ _id: req.query.id }, { $set: product })
        if (productData) {
            saveLog(`Product ${productData._id} edited`,'updation', req.session.isAdmin)

            res.redirect('/admin/products')
        }
        else {
            res.render('Something went wrong')
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listCategory = async (req, res) => {
    try {
        const categoryData = await Category.find()
        res.render('listCategory', { categoryData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveCategory = async (req, res) => {
    try {
        const categoryData = new Category({
            name: req.body.name,
            is_unlisted: false,
        })
        if (await categoryData.save()) {
            saveLog(`Category ${categoryData.name} newly created`,'created', req.session.isAdmin)

            res.json({ success: true })
        }
        else {
            res.json({ success: false })
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const encrypt = async (pass, isCompare, encPass) => {
    try {
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
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const unlistCategory = async (req, res) => {
    try {
        const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { is_unlisted: true } })
        saveLog(`Category ${categoryData.name} unlisted`,'visibility', req.session.isAdmin)

        res.redirect('/admin/category')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const tolistCategory = async (req, res) => {
    try {
        const categoryData = await Category.findByIdAndUpdate({ _id: req.query.id }, { $set: { is_unlisted: false } })
        saveLog(`Category ${categoryData.name} listed`,'visibility', req.session.isAdmin)

        res.redirect('/admin/category')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const addBanner = async (req, res) => {
    try {
        res.render('addBanner')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveBanner = async (req, res) => {
    try {
        const original = path.join(__dirname, '../public/assets/productImages/' + req.files[0].filename)
        const modded = path.join(__dirname, '../public/assets/productImages/size_fixed_' + req.files[0].filename)
        sharp(original).resize(691, 691, {
            fit: 'cover',
            position: 'center'
        }).toFile(modded, (err, info) => {
            if (err) {
                console.log(err);
            }
        })
        const bannerData = new Banner({
            name: req.body.name,
            image: 'size_fixed_' + req.files[0].filename,
            is_unlisted: false
        })
        if (await bannerData.save()) {
            saveLog(`Banner ${bannerData.name} newly created`,'created', req.session.isAdmin)

            res.redirect('/admin/banners')
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listBanner = async (req, res) => {
    try {
        const bannerData = await Banner.find()
        res.render('listBanners', { bannerData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listCoupons = async (req, res) => {
    try {
        new Date().to
        const isExists = await Coupon.find()
        isExists.forEach(async (isExists) => {
            const currentDate = new Date().getTime()
            const expireDate = new Date(isExists.expireAt).getTime()
            if (expireDate <= currentDate) {
                await Coupon.findOneAndUpdate({ name: isExists.name }, { $set: { validity: "expired" } })
            }else{
                await Coupon.findOneAndUpdate({ name: isExists.name }, { $set: { validity: "active" } })
            }
        })
        const couponData = await Coupon.find()

        res.render('listCoupons', { couponData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const blockUser = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { is_blocked: true } })
        saveLog(`User ${userData.email} blocked`,'visibility', req.session.isAdmin)

        res.json({ success: true })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const unblockUser = async (req, res) => {
    try {
        const userData = await User.findByIdAndUpdate({ _id: req.body.id }, { $set: { is_blocked: false } })
        saveLog(`User ${userData.email} unblocked`,'visibility', req.session.isAdmin)

        res.json({ success: true })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const deleteUser = async (req, res) => {
    try {
        const binData = await User.findById({ _id: req.body.id })
        putToBin('User', binData, req.session.isAdmin)
        const userData = await User.findByIdAndDelete({ _id: req.body.id })
        saveLog(`User ${userData.email} deleted`,'deletion', req.session.isAdmin)

        res.json({ success: true })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const disableCoupon = async (req, res) => {
    try {
        const userData = await Coupon.findByIdAndUpdate({ _id: req.query.id }, { $set: { disabled: true } })
        saveLog(`Coupon ${userData.name} disabled`,'visibility', req.session.isAdmin)

        res.redirect('/admin/coupons')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const enableCoupon = async (req, res) => {
    try {
        const userData = await Coupon.findByIdAndUpdate({ _id: req.query.id }, { $set: { disabled: false } })
        saveLog(`Coupon ${userData.name} enabled`,'visibility', req.session.isAdmin)

        res.redirect('/admin/coupons')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const loadeditCoupon = async (req, res) => {
    try {
        const couponData = await Coupon.findById({ _id: req.query.id })
        res.render('editCoupon', { couponData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
    }
}
const saveEditCoupon = async (req, res) => {
    try {
        const coupon = {
            name: req.body.code,
            amount: req.body.amount,
            expireAt: req.body.expire,
            maxUsers: req.body.maxUsers,
        }
        const couponData = await Coupon.findByIdAndUpdate({ _id: req.query.id }, { $set: coupon })
        if (couponData) {
            saveLog(`Coupon ${coupon.name} edited`,'updation', req.session.isAdmin)

            res.redirect('/admin/coupons')
        } else {
            res.render('editCoupon', { message: "Something went wrong" })
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveCoupon = async (req, res) => {
    try {
        const coupon = new Coupon({
            name: req.body.code,
            amount: req.body.amount,
            createdAt: Date.now(),
            expireAt: req.body.expire,
            maxUsers: req.body.maxUsers,
            disabled: false
        })
        console.log(req.body);
        await coupon.save()
        saveLog(`Coupon ${coupon.name} newly created`,'created', req.session.isAdmin)

        res.redirect('/admin/coupons')
    } catch (error) {
        res.render('addCoupon', { message: "Coupon already exists with the name" })
        console.log(error);
    }
}
const showOrders = async (req, res) => {
    try {
        let orderData;
        if (req.query.user) {
            orderData = await Order.find({ userName: req.query.user })
        }
        else if (req.query.sort) {
            if (req.query.sort == 'date') {
                orderData = await Order.find().sort({ date: 1 })
            } else if (req.query.sort == 'amount') {
                orderData = await Order.find().sort({ totalAmount: 1 })
            }
        }
        else if (req.query.filter) {
            if (req.query.filter == 'cod' || req.query.filter == 'online' || req.query.filter == 'wallet') {
                orderData = await Order.find({ paymentMethod: req.query.filter.toUpperCase() })
            }
            else if (req.query.filter == 'placed' || req.query.filter == 'Delivered' || req.query.filter == 'cancelled') {
                orderData = await Order.find({ orderStatus: req.query.filter })
            }
        }
        else {
            orderData = await Order.find()
        }
        res.render('listOrders', { orderData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const unlistbanner = async (req, res) => {
    try {
        const bannerData = await Banner.findByIdAndUpdate({ _id: req.query.id }, { $set: { is_unlisted: true } })
        saveLog(`Banner ${bannerData.name} unlisted`,'visibility', req.session.isAdmin)

        res.redirect('/admin/banners')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const listbanner = async (req, res) => {
    try {
        const bannerData = await Banner.findByIdAndUpdate({ _id: req.query.id }, { $set: { is_unlisted: false } })
        saveLog(`Banner ${bannerData.name} listed`,'visibility', req.session.isAdmin)

        res.redirect('/admin/banners')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const addCoupon = async (req, res) => {
    try {
        res.render('addCoupon')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const editOrder = async (req, res) => {
    try {
        const orderData = await Order.findById({ _id: req.query.id })
        res.render('editOrder', { orderData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const makeOrderChanges = async (req, res) => {
    try {

        let orderData;
        switch(req.body.orderStatus){
            case "delivered":
            orderData = await Order.findByIdAndUpdate({ _id: req.query.id }, { $set: { orderStatus: req.body.orderStatus,paymentStatus:'recieved' } })

        }
        
        if (orderData) {
            saveLog(`Order ${orderData._id} status updated to ${req.body.orderStatus}`,'updation', req.session.isAdmin)

            res.redirect('/admin/orders')
        }
        else {
            throw new Error('Something went wrong')
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const showOrderedProducts = async (req, res) => {
    try {
        if (req.query.id) {
            let productData = []
            const order = await Order.findById({ _id: req.query.id })
            for (let i = 0; i < order.products.length; i++) {
                productData[i] = await Product.findById({ _id: order.products[i]._id.productId })
            }
            res.render('viewOrder', { productData, orderData: order })
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const loadUpdateBanner = async (req, res) => {
    try {
        const bannerData = await Banner.findById({ _id: req.query.id })
        res.render('editBanner', { bannerData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveEditedBanner = async (req, res) => {
    try {
        let updateData;
        if (!req.body.isNameOnlyUpdate) {
            const original = path.join(__dirname, '../public/assets/productImages/' + req.files[0].filename)
            const modded = path.join(__dirname, '../public/assets/productImages/size_fixed_' + req.files[0].filename)
            sharp(original).resize(691, 691, {
                fit: 'cover',
                position: 'center'
            }).toFile(modded, (err, info) => {
                if (err) {
                    console.log(err);
                }
            })
            updateData = { name: req.body.name, image: 'size_fixed_' + req.files[0].filename }
        }
        else {
            updateData = { name: req.body.name }
        }
        const bannerData = await Banner.findByIdAndUpdate({ _id: req.query.id }, { $set: updateData })
        if (bannerData) {
            saveLog(`Banner ${req.body.name} edited`,'created', req.session.isAdmin)

            res.redirect('/admin/banners')
        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const exportToCsv = async (req, res) => {
    try {
        const workbook = new exceljs.Workbook()
        const worksheet = workbook.addWorksheet("Orders");
        worksheet.columns = [
            { header: "S no.", key: "s_no" },
            { header: "User", key: "userName" },
            { header: "Payment Method", key: "paymentMethod" },
            { header: "Products", key: "products" },
            { header: "Amount Paid", key: "totalAmount" },
            { header: "Total Amount", key: "amount" },
            { header: "Date", key: "date" },
            { header: "Status", key: "orderStatus" }
        ]
        let counter = 1;
        const orderData = await Order.find({});
        orderData.forEach((order) => {
            order.s_no = counter;
            worksheet.addRow(order);
            counter++;
        })

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        })

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res.setHeader("Content-Disposition", `attachment;filename=order.xlsx`)
        saveLog(`Admin requested the sales report (excel)`,'view', req.session.isAdmin)

        return workbook.xlsx.write(res).then(() => {
            res.status(200);
        })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const exportOrderPDF = async (req, res) => {
    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(`http://localhost:3000/admin/sales`, {
            waitUntil: "networkidle2"
        })
        await page.setViewport({ width: 2080, height: 1050 })
        const todayDate = new Date()
        const pdfn = await page.pdf({
            path: `${path.join(__dirname, '../public/assets/files', todayDate.getTime() + ".pdf")}`,
            format: "A3"
        })

        await browser.close()

        const pdfUrl = path.join(__dirname, '../public/assets/files', todayDate.getTime() + ".pdf")

        res.set({
            "Content-Type": "application/pdf",
            "Content-Length": pdfn.length
        })
        saveLog(`Admin requested the sales report (pdf)`,'view', req.session.isAdmin)

        res.sendFile(pdfUrl)
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const sales = async (req, res) => {
    try {
        const orderData = await Order.find()
        res.render('sales', { orderData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const editCategory = async (req, res) => {
    try {
        const categoryData = await Category.findOne({ name: req.query.name })
        if (!categoryData) {
            throw new Error('')
        }
        res.render('renameCategory', { categoryData })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveEditedCategory = async (req, res) => {
    try {
        await Category.findOneAndUpdate({ name: req.query.name }, { $set: { name: req.body.name } })
        saveLog(`Category ${req.query.name} renamed to ${req.body.name}`, req.session.isAdmin)
        res.redirect('/admin/category')
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const logs = async (req, res) => {
    try {
        let loggerData = [];
        if (req.query.date) {
            (await Logger.find()).forEach((log) => {
                const date = new Date(req.query.date).getDate()
                let temp = new Date(log.date).getDate()
                if (temp == date) {
                    loggerData.push(log)
                }
            })
        } else {
            loggerData = await Logger.find()
        }
        saveLog('Logs viewed','view', req.session.isAdmin)

        res.render('logs', { loggerData, message: "Now you are a Super Admin", success: true, date: req.query.date })
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const trash = async (req, res) => {
    try {
        const trashedData = await Trash.find()
        res.render('trash', { trashedData, message: req.query.Done ? req.query.Done + ' restored' : undefined ,success:true})
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const saveLog = async (activity,type, admin) => {
    try {
        const logger = new Logger({
            date: new Date(),
            activity: activity,
            admin: admin,
            type:type
        })
        const loggerData = await logger.save()
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const extraSecurity = async (req, res) => {
    try {
        let expire = req.query.expire
        let message;
        if (!expire) {
            const otp = await userController.generateOtp()
             message = 'Otp to get access as super admin : ' + otp
            const adminData = await User.findOneAndUpdate({ email: req.session.isAdmin }, { $set: { 'auth.otp.value': otp } })
            console.log(color.green(message));
            userController.sendMail(req.session.isAdmin,message)
        }
        res.render('extraSecurity', { expired: expire,message:message })

    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const verifyExtraSecurity = async (req, res) => {
    try {
        const adminData = await User.findOne({ email: req.session.isAdmin })
        if (req.body.otp == adminData.auth.otp.value) {
            saveLog('SuperAdmin access granted','access', req.session.isAdmin)

            await User.findOneAndUpdate({ email: req.session.isAdmin }, { $unset: { 'auth.otp.value': {} } })
            req.session.access = true
            res.json({ success: true, url: req.query.redirect })

        } else {
            res.json({ success: false })
        }
    } catch (error) {
        res.json({ success: false })
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const putToBin = async (type, data, admin) => {
    try {

        const trash = new Trash({
            date: new Date(),
            type: type,
            admin: admin,
            identity:type=='User'?data.email:data.name,
            trashedData: data
        })
        trash.save()
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
const restoreTrash = async (req, res) => {
    try {
        let remove = false
        const trashData = await Trash.findById({ _id: req.query.id })
        if (trashData) {
            if (trashData.type == 'Product') {
                const productData = new Product(trashData.trashedData[0])
                if (productData.save()) {
                    remove = true
                    saveLog('Product '+productData.name+' restored','restore',req.session.isAdmin)
                    res.redirect('trash?Done=Product')
                }else{
                    res.render('logs',{message:"Something went wrong"})
                }
            } else if (trashData.type == 'User') {
                const userData = new User(trashData.trashedData[0])
                if (userData.save()) {
                    remove = true
                    saveLog('User '+userData.username+' restored','restore',req.session.isAdmin)
                    res.redirect('trash?Done=User')
                }
                else{
                    res.render('logs',{message:"Something went wrong"})
                }
            }
        }
        if (remove) {
            await Trash.findByIdAndDelete({ _id: req.query.id })

        }
    } catch (error) {
        res.status(500)
        error.message = 'Something went wrong'
        res.render('error', { message: error.message })
        console.log(error);
    }
}
module.exports = {
    loadHome,
    saveEditedCategory,
    checkAdmin,
    listUsers,
    logout,
    listProducts,
    addProduct,
    saveProduct,
    editProduct,
    resaveProduct,
    listCategory,
    saveCategory,
    addBanner,
    saveBanner,
    listBanner,
    blockUser,
    unblockUser,
    deleteUser,
    listCoupons,
    saveCoupon,
    disableCoupon,
    showOrders,
    unlistbanner,
    listbanner,
    addCoupon,
    enableCoupon,
    loadeditCoupon,
    saveEditCoupon,
    extraSecurity,
    editOrder,
    makeOrderChanges,
    showOrderedProducts,
    loadUpdateBanner,
    saveEditedBanner,
    unlistCategory,
    tolistCategory,
    exportToCsv,
    exportOrderPDF,
    sales,
    editCategory,
    logs,
    trash,
    verifyExtraSecurity,
    putToBin,
    restoreTrash,
}