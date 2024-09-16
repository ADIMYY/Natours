const express = require('express');

const userController = require(`${__dirname}/../Controller/userController`);
const authController = require(`${__dirname}/../Controller/authController`);

const router = express.Router(); // mini app


router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
    '/updateMe', 
    userController.uploadUserPhoto , 
    userController.resizeUserPhoto, 
    userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);


router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllusers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);





module.exports = router;