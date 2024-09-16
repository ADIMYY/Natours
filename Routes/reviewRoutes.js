const express = require('express');

const reviewController = require(`${__dirname}/../Controller/reviewController`);
const authController = require(`${__dirname}/../Controller/authController`);

const router = express.Router({ mergeParams: true });
// POST /tour/2345f89/reviews
// POST /reviews

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReview)
    .post( 
        authController.restrictTo('user'),
        reviewController.setTourUserIds, 
        reviewController.createReview
    );


router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('user', 'admin'), 
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('user', 'admin'), 
        reviewController.deleteReview
);

module.exports = router;