var express = require ('express');
var app = module.exports = express();
const bodyParser = require('body-parser');
const uuid = require('uuid/v1');
const urlencodedParser = bodyParser.urlencoded({ extended : false });
const AWS= require("aws-sdk");
const multer = require('multer');
const multerS3 = require('multer-s3');
var accountSid = 'AC0d8bef4735b4b45382bcf16d72a9e1f8';
var authToken = 'f55989338041e0804a2216d74dd96df4';

var client = require('twilio')(
  accountSid, authToken
);

let awsConfig = {
  "region":"us-east-1",
  "endpoint":"http://dynamodb.us-east-1.amazonaws.com",
  "accessKeyId":"AKIA2TSXN42LKEA3NN7G",
  "secretAccessKey":"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"
};

AWS.config.update(awsConfig);

let dynamoDBclient = new AWS.DynamoDB.DocumentClient();

const s3 = new AWS.S3();

app.post('/login',urlencodedParser, function (req, res){

  if(req.body.action =='signUp')
  {
    signUp(req,res);

  }
});

app.get('/userEvents', function (req, res){

  let params={
  TableName:"user_Events",
   FilterExpression: "#emailId =:eeee",
   ExpressionAttributeNames:{
       "#emailId": "emailId"
    },
    ExpressionAttributeValues: {
       ":eeee": req.query.userEmail,

  }
  };
    dynamoDBclient.scan(params, function(err,data){
    //console.log("In GET___");
      if(err){
        console.log("ERR"  + JSON.stringify(err));
      }
      else {
        console.log(data.Items);
        res.render('userEvents',{item : data.Items});
        //res.render('searchEvent',{item:data.Items});
      }
  })


});

app.post('/register',urlencodedParser, function (req, res){
  //Twilio messaging service

  var data = req.body;
  console.log(data.userPhoneNo);
  client.messages.create({
    from: "+19803191617",
    to: data.userPhoneNo,
    body: "Hi "+ data.userFirstName+" , You have successfully registered for '"+
          data.eventName+"' which is happening on  "+data.date+" at "+data.time+"!"
  }).then((message) => console.log(message.sid));

  //DynamoDB Services
   var input={

     id : req.body.userEmail+req.body.eventId,
     Name : req.body.userFirstName,
     emailId : req.body.userEmail,
     userPhone : req.body.userPhoneNo,
     eventId : req.body.eventId,
     eventName : req.body.eventName,
     eventCategory: req.body.cat,
     eventDescription : req.body.desc,
     eventOrganizer : req.body.org,
     eventCity : req.body.city,
     eventdate : req.body.date,
     eventtime : req.body.time
   }

   var params = {
     TableName : 'user_Events',
     Item : input
   }

   dynamoDBclient.put(params, function(err, data) {
     if (err) {
       console.log("Error", err);
     } else {
       console.log("Success");

       res.redirect('/searchEvent');
   //res.render('eventPage', { data: dbData});
     }
   });






});

app.get('/', function (req, res) {
  res.render('index')
})

app.get('/index', function (req, res) {
  res.render('index')
})

app.get('/eventPage', function (req, res) {
  res.render('eventPage',{item:[], user:[]})
})

app.get('/eventPage/:eventId', function (req, res) {
  console.log(req.query)
  getEvent(req,res);

})

// app.post('/eventPage/:eventId', urlencodedParser, function (req, res) {
//   getEvent(req,res);
// });

app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/userprofile', function (req, res) {
  res.render('userprofile')
});

const fileFilter = (req,file, cb) =>{
  if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png'){
    cb(null,true)
  }else{
    cb(new Error('Invalid Mime Type, Only JPEG and PNG'), false);
  }
}

var upload = multer({
  fileFilter:fileFilter,
  storage: multerS3({
    s3: s3,
    bucket: 'eventlite-userprofileimages1',
    acl:'pubic-read',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});

const userImage = upload.single('user');

app.post('/userProfile', function(req, res) {
  userImage(req, res, function(err){
    return res.JSON({'imageUrl':req.file.location});
  });
  res.send('/userProfile');
})


app.get('/searchEvent', function (req, res) {
  res.render('searchEvent',{item:[]});
})

app.post('/searchEvent',urlencodedParser, function(req,res){

  searchEvent(req,res);
});

let getEvent = function(req,res)
{
  var params = {
  TableName: 'Event',
  Key: {
    'eventId': req.params.eventId
  }

};
dynamoDBclient.get(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", {item:data.Item});
    res.render('eventPage',{item:data.Item, user:req.query });
//res.render('eventPage', { data: dbData});
  }
});
}


let searchEvent= function(req,res){

  let params={
  TableName:"Event",
   FilterExpression: "#city =:cccc and #state=:ssss and #zipcode=:zzzz and #eventType=:eeee",
   ExpressionAttributeNames:{
       "#city": "city",
       "#state":"state",
       "#zipcode":"zipCode",
       "#eventType":"category"
    },
    ExpressionAttributeValues: {
       ":cccc": req.body.city,
       ":ssss": req.body.state,
       ":zzzz": req.body.zipcode,
       ":eeee": req.body.eventType,
  }
  };
    dynamoDBclient.scan(params, function(err,data){
    //console.log("In GET___");
      if(err){
        console.log("ERR"  + JSON.stringify(err));
      }
      else {
      //  console.log("data");
      //  console.log(data.Items);
        res.render('searchEvent',{item:data.Items});
        /*
        data.Items.forEach(function(item) {
            console.log("item");
            console.log(JSON.stringify(item));

        });
        */
      }
  })

}

let signUp= function(req,res){
  console.log("IN SIGNUP___");

  let input= {
    "email":req.body.email,
    "password":req.body.pwd,
    "firstName": req.body.fname,
    "lastName": req.body.lname
  }
  let params={
    TableName:"Users",
    Item: input
  };
    dynamoDBclient.put(params, function(err,data){
      console.log("In GET___");
      if(err){
        console.log("ERR"  + JSON.stringify(err));
      }
      else {
        console.log("Added successfully");
      }
    })
    res.redirect('/login');
};
