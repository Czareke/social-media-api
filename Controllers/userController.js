const AppError=require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const User=require('../Model/userModel')





exports.getAllUsers=catchAsync(async(req,res,next)=>{
    const users=await User.find()
    res.status(200).json({
        status:'success',
        results:users.length,
        data:{
            users
        }
    })
})
exports.getOneUser=catchAsync(async(req,res,next)=>{
    const users=await User.findById(req.params)
    if(!users){
        return next(new AppError('No user found with that ID',404))
    }res.status(200).json({
        status:'success',
        data:{
            users
        }
    })
})
exports.updateUser=catchAsync(async(req,res,next)=>{
    const users=await User.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })
    if(!users){
        return next(new AppError('No user found with that ID',400))
    }res.status(200).json({
        status:'success',
        data:{
            users
        }
    })
})
exports.deleteUser=catchAsync(async(req,res,next)=>{
    const users=await User.findByIdAndDelete(req.params.id,req.body,{
        new:true,
        runValidators:true
    })
    if(!users){
        return next(new AppError('No user found with that ID',400))
    }res.status(200).json({
        status:'success',
        data:null,
        message:'User Has been deleted successfully'
    })
})
exports.updateMe=catchAsync(async(req,res,next)=>{
    if(req.password && req.confirmPassword){
        return next(new AppError('This route is not for password update',400))
    }
    const filteredBody=filterObj(req.body,'userName','email')
    const updateUser=await User.findByIdAndUpdate(req.user.obj,filteredBody,{
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
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.user.id);
    res.status(204).json({
        status: "success",
        data: null,
    });
});