const express=require('express')
const post=require('../Controllers/postController.js');
const auth=require('../Controllers/authController.js');
const router=express.Router();
router.
route('post')
.get(auth.protect,post.getAllPosts)
.post(auth.protect,auth.restrictTO('admin'),post.createPost)

router.
route('/post/:id')
.get(auth.protect,post.getOnePost)
.patch(auth.protect,auth.restrictTO('admin','author'),post.updatePost)
.delete(auth.protect,auth.restrictTO('admin','author'),post.deletePost)

module.exports = router