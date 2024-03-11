const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const connect = require('./config/connect')
const fs = require('fs')
connect()
const session = require('express-session')
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
require('dotenv').config()
const cluster = require('cluster')
const numCpu = require('os').cpus().length;
const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'THE SECRET',
  saveUninitialized: false,
  resave: false
}))

app.use('/', userRouter);
app.use('/admin', adminRouter);

app.get('*', (req, res) => {
  res.status(404)
  res.render('404')
})
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT
app.listen(port, () => {
  console.log('http://gadgetzone.com:' + port);
})
