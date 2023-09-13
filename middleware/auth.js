async function isAuthenticated(req, res, next) {
    
    try {
        if (req.session.user) {
            next()
        }
        else {
            if (req.path != '/login') {
                res.redirect(`/login?redirect=${req.url}`)
            } else {
                const user_agent = req.headers['user-agent'];
                if (user_agent.includes('Mobile')) {
                    res.render('login', { title: 'loginPage', message: "Login to continue", isMobile: true })
                }
                else {
                    res.render('login', { title: 'loginPage', message: message })
                }
            }
        }
    } catch (error) {
        res.render('login', { title: 'loginPage', message: "Login to continue" })
        console.log(error.message);
    }
}
module.exports = isAuthenticated