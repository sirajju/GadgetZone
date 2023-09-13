const express = require('express');
const app = express();
const path = require('path')
const userController = require('../controllers/userController')
const adminController = require('../controllers/adminController.js')
const productController = require('../controllers/productController.js')
const isLogged = require('../middleware/adminAuth.js')
const extraSecurity = require('../middleware/extraSecurity')
const multer = require('multer')

app.set('views',path.join(__dirname,'../views/admin'))

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/assets/productImages'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})
const upload = multer({storage:storage})


app.get('/',isLogged,adminController.loadHome)
app.get('/users',isLogged,adminController.listUsers)
app.get('/products',isLogged,adminController.listProducts)
app.get('/addProduct',isLogged,adminController.addProduct)
app.get('/editProduct',isLogged,adminController.editProduct)
app.get('/listcategory',isLogged,adminController.tolistCategory)
app.get('/unlistcategory',isLogged,adminController.unlistCategory)
app.get('/addBanner',isLogged,adminController.addBanner)
app.get('/banners',isLogged,adminController.listBanner)
app.get('/logout',adminController.logout)
app.get('/delete',isLogged,productController.deleteProduct)
app.get('/deactivate',isLogged,productController.deActivate)
app.get('/activate',isLogged,productController.activate)
app.get('/editUser',isLogged,userController.editUser)
app.get('/category',isLogged,adminController.listCategory)
app.get('/coupons',isLogged,adminController.listCoupons)
app.get('/addCoupon',isLogged,adminController.addCoupon)
app.get('/viewOrderedProducts',isLogged,adminController.showOrderedProducts)
app.get('/orders',isLogged,adminController.showOrders)
app.get('/disableCoupon',isLogged,adminController.disableCoupon)
app.get('/enableCoupon',isLogged,adminController.enableCoupon)
app.get('/editCoupon',isLogged,adminController.loadeditCoupon)
app.get('/unlistbanner',isLogged,adminController.unlistbanner)
app.get('/trash',isLogged,extraSecurity,adminController.trash)
app.get('/logs',isLogged,extraSecurity,adminController.logs)
app.get('/listbanner',isLogged,adminController.listbanner)
app.get('/updateBanner',isLogged,adminController.loadUpdateBanner)
app.get('/editOrder',isLogged,adminController.editOrder)
app.get('/expotOrderToCsv',isLogged,adminController.exportToCsv)
app.get('/exportOrderToPdf',isLogged,adminController.exportOrderPDF)
app.get('/editCategory',isLogged,adminController.editCategory)
app.get('/extraSecurity',isLogged,adminController.extraSecurity)
app.get('/restoreTrash',isLogged,extraSecurity,adminController.restoreTrash)
app.get('/sales',adminController.sales)


app.post('/extraSecurity',adminController.verifyExtraSecurity)
app.post('/editCategory',adminController.saveEditedCategory)
app.post('/updateBanner',upload.array('img',1),adminController.saveEditedBanner)
app.post('/editOrder',adminController.makeOrderChanges)
app.post('/editUser',userController.saveEditedUser)
app.post('/editCoupon',adminController.saveEditCoupon)
app.post('/addCoupon',adminController.saveCoupon)
app.post('/block',adminController.blockUser)
app.post('/unblock',adminController.unblockUser)
app.post('/deleteUser',adminController.deleteUser)
app.post('/addBanner',upload.array('img',1),adminController.saveBanner)
app.post('/addCategory',adminController.saveCategory)
app.post('/',adminController.checkAdmin)
app.post('/addProduct',upload.array('image',10),adminController.saveProduct)
app.post('/editProduct',upload.array('image',10),adminController.resaveProduct)

module.exports = app;
