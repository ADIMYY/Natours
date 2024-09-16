const express = require('express');

const bookingController = require(`${__dirname}/../Controller/bookingController`);
const authController = require(`${__dirname}/../Controller/authController`);

const router = express.Router();

router.use(authController.protect);

router.get(
    '/checkout-session/:tourId', 
    bookingController.getCheckoutSession
);

router.use(authController.restrictTo('lead-guide', 'admin'));

router
    .route('/')
    .get(bookingController.getAllBooking)
    .post(bookingController.createBooking);

router
    .route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking);

module.exports = router;