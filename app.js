const express = require('express');
const morgan = require('morgan');
require('dotenv').config()
const bodyParser = require('body-parser')
require('express-async-errors')
const expressSession=require('express-session')
const fileUpload=require('express-fileupload')
const userRoutes=require('./Routes/userRoutes')
const postRoutes=require('./Routes/postRoutes')
const globalErrorHandler=require('./Controllers/errorController')

const app = express();
app.use(bodyParser.json());
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
})
app.use(expressSession({
    secret: "hello world",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: false,
    },
}))
app.get("/", (req, res) => {
    res.send("<h1>Wiki Api</h1><a href='/api-docs'>Documentation</a>");
});
app.use('/api/v1/user',userRoutes)
app.use('api/v1/post',postRoutes)




//TODO add yaml,swagger,use development or production for my error handling,add searching functions

module.exports=app
