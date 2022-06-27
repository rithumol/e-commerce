require('dotenv').config();


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
// var fileUpload = require('express-fileupload');
var db = require('./config/connection')
var session=require('express-session')

//const Swal = require('sweetalert2')
//const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const { handlebars } = require('hbs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))
//app.engine(handlebars,hbs({handlebars: allowInsecurePrototypeAccess(_handlebars)}))
var Hbs = hbs.create({})
Hbs.handlebars.registerHelper('eq', (a, b) => a == b)
Hbs.handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(fileUpload())

app.use((req,res,next)=>{
  if(!req,res){
      res.header('cache-control','private,no-cache,no-store,must revalidate')
      res.header('Express','-3')
    
  }
  next();
})

// to use session
app.use(session({
  secret:"Key",
  cookie:{maxAge:600000}
}))

// to connect database
db.connect((err)=>{
  if(err) 
    console.log("Connection Error" +err)
  else
    console.log("Database Connected")
})

app.use('/', userRouter);
app.use('/admin',adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
  res.render('404',{err404:true});
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('404');
});

module.exports = app;
