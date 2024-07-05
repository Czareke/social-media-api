const AppError=require('../utils/appError');
const catchAsync=require('../utils/catchAsync');
const Post=require('../Model/postModel')
const cloudinary=require('cloudinary').v2
const multer=require('multer')
const fs=require('fs')
const path=require('path')


exports.getAllPosts=catchAsync(async(req,res,next)=>{
    const posts=await Post.find()
    res.status(200).json({
        status:'success',
        results:posts.length,
        data:{
            posts
        }
    })
})
exports.getOnePost=catchAsync(async(req,res,next)=>{
    const posts=await Post.findById(req.params.id)
    if(!posts){
        return next(new AppError('No posts found',404))
    }res.status(200).json({
        status:'success',
        data:{
            posts
        }
    })
})
// exports.createPost=catchAsync(async(req,res,next)=>{
//     const {title,content,userId}=req.body
//     let postData={
//         title,
//         content,
//         author:userId,
//         created_at:new Date()
//     }
//     try{
//         //config multer for img upload
//         const uploads=multer({dest:'../tmp'})
//         //handle both local and cloudinary files
//         if(req.body.uploadType==='local'){
//         //handle local files
//             const handleLocalUpload=async(req,res)=>{
//                 if(!req.files){
//                     return next(new AppError('No files were uploaded',400))
//                 }
//                 const productImage=req.files.image
//                 if(!productImage.mimetype.startsWith('image')){
//                     return next(new AppError('Please upload an image',400))
//                 }
//                 const maxSize=1024*10+20
//                 if(productImage>maxSize){
//                     return next(new AppError('Image size is too big',400))
//                 }
//                 const imagePath=path.join(__dirname,'../public/uploads'+`${productImage.name}`)
//                 await productImage.mv(imagePath)
//                 postData.image={src:`/uploads/${productImage.name}`}
//             }
//             handleLocalUpload(req,res)
//         }
//             else if(req.body.uploadType === cloudinary'){
//             //handle cloudinary files
//             const handleCloudinaryUpload=async(req,res)=>{
//                 if(!req.files){
//                     return next(new AppError('No files were uploaded',400))
//                 }
//                 const productImage=req.files.image
//                 if(!productImage.mimetype.startsWith('image')){
//                     return next(new AppError('Please upload an image',400))
//                 }
//                 const maxSize=1024*10+20
//                 if(productImage>maxSize){
//                     return next(new AppError('Image size is too big',400))
//                 }
//                 const result=await cloudinary.uploader.upload(productImage.tempFilePath)
//                 postData.image={src:result.secure_url,public_id:result.public_id}
//             }
//             handleCloudinaryUpload(req,res)
//         }else{
//             return next(new AppError('Invalid upload type',400))
//         }
//         const savePost=await Post.create(postData)
//         res.status(201).json({
//             status:'success',
//             data:{
//                 post:savePost
//             }
//         })
//     }catch(error){
//         console.error(error)
//         res.status(500).send({message:'Error creating post',error:error})
//     }
// })
exports.createPost = catchAsync(async (req, res, next) => {
    const { title, content, userId } = req.body;

  // Validate title and content (add your validation logic here)

    let postData = {
    title,
    content,
    author: userId, // Assuming 'author' field in the model
    created_at: new Date(),
    };
    try {
    // Configure Multer for image upload (if needed)
    const upload = multer({ dest: 'uploads/' }); // Configure temporary upload destination (if using local upload)

    // Handle both local and Cloudinary image upload options
    if (req.body.uploadType === 'local') {
      // Local image upload logic (function outside the route)
        const handleLocalUpload = async (req, res) => {
        if (!req.files) {
            return next(new AppError('No files were uploaded', 400));
        }

        const productImage = req.files.image;

        if (!productImage.mimetype.startsWith('image')) {
            return next(new AppError('Please upload an image', 400));
        }

        const maxSize = 1024 * 10 + 20; // Adjust max size as needed
        if (productImage.size > maxSize) {
            return next(new AppError('Image size is too big', 400));
        }

        // Local file system operations (if applicable)
        // ... (your local upload logic, e.g., using fs and path)

        postData.image = { src: `/uploads/${productImage.name}` }; // Update with actual image path
        };

      // Call the local upload handler within your route logic
      // ... (your route logic for local upload)
        handleLocalUpload(req, res);
}       else if (req.body.uploadType === 'cloudinary') {
      // Cloudinary image upload logic (function outside the route)
        const handleCloudinaryUpload = async (req, res) => {
        if (!req.files) {
            return next(new AppError('No files were uploaded', 400));
        }

        const productImage = req.files.image;

        if (!productImage.mimetype.startsWith('image')) {
            return next(new AppError('Please upload an image', 400));
        }

        const uploadResult = await cloudinary.v2.uploader.upload(productImage.tempFilePath, {
            use_filename: true,
          folder: "file-upload", // Or your desired Cloudinary folder
        });

        fs.unlinkSync(productImage.tempFilePath); // Remove temporary file

        postData.image = { src: uploadResult.secure_url, public_id: uploadResult.public_id };
    };

      // Call the Cloudinary upload handler within your route logic
      // ... (your route logic for Cloudinary upload)
        handleCloudinaryUpload(req, res);
    } else {
        return next(new AppError('Invalid upload type', 400));
    }

    // Save post data to database (including image object if uploaded)
    const savedPost = await Post.create(postData);

    res.status(201).json({
        status: 'success',
        data: {
        post: savedPost,
        },
    });
} catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error creating post', error: error }); // Or more specific error message
}
});
exports.likePost=catchAsync(async(req,res,next)=>{
    const posts=await Post.findById(req.params.id)
    if(!posts){
        return next(new AppError('No posts found',404))
    }
    if(posts.likes.includes(req.user.id)){
        posts.likes=posts.likes.filter(id=>id!==req.user.id)
    }else{
        posts.likes.push(req.user.id)
    }
    await posts.save()
    res.status(200).json({
        status:'success',
        data:{
            posts
        }
    })
})


exports.deletePost=catchAsync(async(req,res,next)=>{
    const posts=await Post.findByIdAndDelete(req.params.id)
    if(!posts){
        return next(new AppError('No posts found',404))
    }
    res.status(200).json({
        status:'success',
        data:null,
        message:'Post deleted successfully'
        
    })
})

exports.updatePost=catchAsync(async(req,res,next)=>{
    const posts=await Post.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })
    if(!posts){
        return next(new AppError('No posts found',404))
    }
    res.status(200).json({
        status:'success',
        data:{
            posts
        }
    })
})