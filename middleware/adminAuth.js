async function isLogged(req,res,next){
    try {
        if(req.session.isAdmin){
            next()
        }
        else{
            if(req.url!='/'){
                res.redirect('/admin')
            }
            else{
                res.render('adminLogin')
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = isLogged