const Review = require(`${__dirname}/../models/reviewModel`);
const factory = require(`${__dirname}/handlerFactory`);
// const catchAsync = require(`${__dirname}/../utils/catchAsync`);



exports.setTourUserIds = (req, res, next) => {
    // allow nested route
    if (!req.body.tour)
        req.body.tour = req.params.tourId;

    if (!req.body.user)
        req.body.user = req.user.id;

    next();
};


exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review); // no auth in this point