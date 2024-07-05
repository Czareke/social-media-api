const AppError=require('../utils/appError');
const User=require('../Model/userModel');
const catchAsync=require('../utils/catchAsync');
const { promisify } = require("util");
const jwt=require('jsonwebtoken')
const crypto=require('crypto');
const sendMail=require('../utils/email')
const {validationResult}=require('express-validator')
const signToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}

exports.signup=catchAsync(async(req,res,next)=>{
const newUser=await User.create({
    username:req.body.username,
    dateOfBirth:req.body.dateOfBirth,
    email:req.body.email,
    password:req.body.password,
    confirmPassword:req.body.confirmPassword,
    role:req.body.role
}) 
const token=signToken(newUser._id)
res.status(201).json({
    status:'success',
    token,
    data:{
        user:newUser
    }
})
})
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
        return next(new AppError('Please provide email', 400));
    }
    if (!password) {
        return next(new AppError('Please provide password', 400));
    }

    // Find the user by email and select the password field explicitly
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and if the password is correct
    if (!user || !(await user.correctPassword(password,user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // Generate a token
    const token = signToken(user._id);

    // Send response with token and user data
    res.status(200).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
});
    exports.protect=catchAsync(async(req,res,next)=>{
        let token
        if(req.headers.authorization && req.headers.authorization.startswith('Bearer ')){
            token=req.headers.authorization.split(' ')[1]
        }
        console.log(token)
        if(!token){
            return next(new AppError('You are not logged in! Please log in to get access',401))
        }
        const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET)
        console.log(decoded)
        const freshUser=await User.findById(decoded.id)
        if(!freshUser){
            return next(new AppError('The user belonging to this token does no longer exist',401))
        }
        if(freshUser.changedPasswordAfter(decoded.iat)){
            return next(new AppError('User recently changed password! Please log in again',401))
        }
        req.user=freshUser
        next()
    })
    exports.restrictTO=(...roles)=>{
        return (req,res,next)=>{
            if(!roles.includes(req.user.role)){
                return next(new AppError('You do not have permission to perform this action',403))
            }
            next()  
        }
    }
    exports.forgotPassword=catchAsync(async(req,res,next)=>{
        const user=await User.findOne({email:req.body.email})
        if(!user){
            return next(new AppError('There is no user with this email',404))
        }
        const resetToken=user.createPasswordResetToken()
        try{
            await user.save({validateBeforeSave:false})
            const resetUrl=`${req.protocol}://${req.get('host')}/api/v1/user/resetPassword/${resetToken}`
            const message=`Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email`  
            await sendMail({
                email:user.email,
                subject:'Your password reset token (valid for 10 min)',
                message
            })
            res.status(200).json({
                status:'success',
                message:'Token sent to email'
            })
        }catch(err) {
            user.passwordResetToken=undefined
            user.passwordResetExpires=undefined
            await user.save({validateBeforeSave:false})
            return next(new AppError('There was an error sending the email. Try again later',500))
        }
    })
    exports.resetPassword=catchAsync(async(req,res,next)=>{
        const hashedToken=crypto.createHash('sha256').update(req.params.token).digest('hex')
        const user=await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}})
        if(!user){
            return next(new AppError('Token is invalid or has expired',400))
        }
        user.password=req.body.password
        user.confirmPassword=req.body.confirmPassword
        user.passwordResetToken=undefined
        user.passwordResetExpires=undefined
        await user.save()
        const token=signToken(user._id)
        res.status(200).json({
            status:'success',
            token
        })
    })
    exports.updatePassword=catchAsync(async(req,res,next)=>{
        const user=await User.findById(req.user.id).select('+password')
        if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
            return next(new AppError('Your current password is wrong',401))
        }
        user.password=req.body.password
        user.confirmPassword=req.body.confirmPassword
        await user.save()
        const token=signToken(user._id)
        res.status(200).json({
            status:'success',
            token
        })
    })
    exports.updateMe=catchAsync(async(req,res,next)=>{
        if(req.body.password || req.body.confirmPassword){
            return next(new AppError('This route is not for password updates. Please use /updateMyPassword',400))
        }
        const updateUser=await User.findByIdAndUpdate(req.user.id,req.body,{
            new:true,
            runValidators:true
        })
        res.status(200).json({
            status:'success',
            data:{
                updateUser
            }
        })
    })
    exports.updatePassword=catchAsync(async(req,res,next)=>{
        const user = await User.findById(req.params.id).select('+password')
        if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
            return next(new AppError('Your current password is wrong',401))
        }
        user.password=req.body.password
        user.confirmPassword=req.body.confirmPassword
        const token=signToken(user._id)
        res.status(200).json({
            status:'success',
            token
        })
    })
    exports.deleteMe=catchAsync(async(req,res,next)=>{
        await User.findByIdAndDelete(req.user.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    })
    exports.logout=catchAsync(async(req,res,next)=>{
        res.cookie('jwt','',{
            expires:new Date(Date.now()+10*1000),
            httpOnly:true
        })
        res.status(200).json({
            status:'success',
            message:'Cookie deleted'
        })
    })
    exports.editProfile=catchAsync(async(req, res, next)=>{
        const errors=validateResult(req)
        if(!errors.isEmpty()){
            return next(new AppError('validation Failed',400))
        }
        const {username,dateOfBirth,email}=req.body
        if(!username||!dateOfBirth||!email){
            return next(new AppError('Please provide username, dateOfBirth and email',400))
        }
        const user=await User.findByIdAndUpdate(req.user.id,{username,dateOfBirth,email},{
            new:true,
            runValidators:true
        })
        res.status(200).json({
            status:'success',
            data:{
                user
            },
            message:'Profile updated'
        })
    })