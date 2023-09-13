const User = require('../model/userSchema')

const isBanned = async(req,res,next)=>{
    try {
        const userData= await User.findOne({email:req.session.email})
        console.log(req.url);

        if(userData.is_blocked){
            if(req.url=='/login'){
                res.render('login',{message:"You have been banned"})
            }else{
                res.redirect('/login')
            }
        }
        else{
            next()
        }

    } catch (error) {
        console.log(error.message);
    }
}
module.exports = isBanned