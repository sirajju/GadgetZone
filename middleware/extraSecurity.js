const extraSecurity = async(req,res,next)=>{
    try {
        if(req.session.access){
            if(req.session.accessedTime){
                const curr = new Date().getTime()
                if(curr>req.session.accessedTime){
                    req.session.access=false
                    req.session.accessedTime = false
                    res.redirect('/admin/extraSecurity?expire=true&&redirect='+req.url)
                }
            }else{
                    req.session.accessedTime = new Date().getTime()+(1000*1000)
        }
            if(req.session.access){
                    next()
            }
        }else{
            res.redirect('/admin/extraSecurity?redirect='+req.url)
        }
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = extraSecurity