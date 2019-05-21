var express = require ('express')
var app = express()
const AWS= require("aws-sdk");
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended : false });
app.set('view engine', 'ejs')
app.set('views', './views')

app.use('/stylesheets', express.static('./views/static/stylesheets'))
app.use('/images', express.static('./views/static/images'))
let eventController= require('./controllers/Event.js');
app.use('/',eventController);
app.listen(8080);
console.log("Listening to port 8080");
