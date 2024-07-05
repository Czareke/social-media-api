const express=require('express')
const user=require('../Controllers/userController.js');
const auth=require('../Controllers/authController.js');
const router=express.Router();

router.post('/signup',auth.signup)
router.post('/login',auth.login)
router.post('/forgotPassword',auth.forgotPassword)
router.post('/resetPassword/:token',auth.resetPassword)
router.use(auth.protect)
router.patch('/updatePassword',auth.updatePassword)
router.patch('/updateMe',auth.updateMe)
router.post('/logout',auth.logout)

router
.route('/user')
.get(auth.protect,auth.restrictTO('admin'),user.getAllUsers)


router.use(auth.restrictTO('admin'))
router
.route('/user/:id')
.get(user.getOneUser)
.patch(user.updateUser)
.delete(user.deleteUser)
.delete(auth.protect,user.deleteMe)
module.exports = router


