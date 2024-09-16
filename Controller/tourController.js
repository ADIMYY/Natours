/* eslint-disable*/
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const Tour = require(`${__dirname}/../models/tourModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const factory = require(`${__dirname}/handlerFactory`);
const AppError = require(`./../utils/appError`);
const { promises } = require('dns');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please uploud only images', 400), false)
    }
}

const upload = multer({
    storage: multerStorage, 
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 }, 
    { name: 'images', maxCount: 3}
]);

// upload.single('imageCover');
// upload.array('images', 3);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    console.log(req.files);
    if (!req.files || !req.files.imageCover) return next();
    
    // Process Cover Image
    const tourImagesDir = path.join(__dirname, '..', 'public', 'img', 'tours');
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    const imagePath = path.join(tourImagesDir, req.body.imageCover);
    
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(imagePath);


    // Process Images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, idx) => {
            const tourImagesDir = path.join(__dirname, '..', 'public', 'img', 'tours');
            const filename = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;
            const imagePath = path.join(tourImagesDir, filename);

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(imagePath);
            
            req.body.images.push(filename);
        })
    );

    next();
});


exports.aliasTopTour = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingsAvrage';
    req.query.fields = 'name,price,ratingsAvrage,summary,difficulty'
    next();
}

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync( async(req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: { //!   grouped by (esay, medium, difficult)
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            $unwind: `$startDates`
        },
        {
            $addFields: {
                startDates: {
                    $toDate: '$startDates'
                }
            }
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});


// *   /tours-within/:distance/center/:latlng/unit/:unit
// *   /tours-within/22253/center/34.114461,-118.112281/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const redius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(new AppError('please provide latituter and longitude in the format lat, lng', 400)); // 400 => bad request
    }

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], redius] }  }
    });

    res.status(200).json({
        status: 'success 😄',
        results: tours.length,
        data: {
            data: tours
        }
    });
});


exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('please provide latituter and longitude in the format lat, lng', 400)); //* 400 => bad request
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            data: distances
        }
    })
});