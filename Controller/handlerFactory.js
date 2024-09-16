const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const APIFeature = require(`${__dirname}/../utils/apiFeatures`);

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    if (!doc) {
        return next(new AppError('No document found with this ID', 404));
    };
    
    res.status(204).json({ // 204 ==> stande for No content
        status: 'success',
        data: null
    });
});


exports.updateOne = Model => catchAsync( async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    if (!doc) {
        return next(new AppError('No document found with this ID', 404));
    };

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});


exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    
    res.status(201).json({ // 201 ==> stands for created, 200 ==> stands for okay.
        status: "success",
        data : {
            data: doc
        }
    });
});


exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions)
        query = query.populate(popOptions);
    const doc = await query
    
    if (!doc) {
        return next(new AppError('No document found with this ID', 404));
    };

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});


exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId)
        filter = { tour: req.params.tourId };

    // EXCUTE QUERY
    const feature = new APIFeature(Model.find(filter), req.query)
        .Filter()
        .sort()
        .limitFields()
        .paginate();
    // const doc = await feature.query.explain();
    const doc = await feature.query;


    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        reuslts: doc.length,
        data: {
            data: doc
        }
    });
});