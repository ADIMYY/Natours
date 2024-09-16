const express = require('express');

const tourController = require(`${__dirname}/../Controller/tourController`);
const authController = require(`${__dirname}/../Controller/authController`);
const reviewRouter = require(`${__dirname}/../Routes/reviewRoutes`);

const router = express.Router();

// router.param('id', tourController.checkId);

// create a checkBody middleware function.
// check if body contains the name and price property.
// if not, send back 400 (bad request).
// add it to the post handler stack.



// POST /tour/123j85675/reviews
// GET /tour/1234f77/56reviews



router.use('/:tourId/reviews', reviewRouter);

router
    .route('/top-5-cheap')
    .get(tourController.aliasTopTour, tourController.getAllTours);

router
    .route('/tour-stats')
    .get(tourController.getTourStats);

router
    .route('/monthly-plan/:year')
    .get(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide', 'guide'), 
        tourController.getMonthlyPlan
    );


router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);


router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);


router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.createTour
    )
    .post(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.getAllTours
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImages, 
        tourController.resizeTourImages, 
        tourController.updateTour
    )
    .delete(
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'), 
        tourController.deleteTour
    );


module.exports = router;