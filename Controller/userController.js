/*eslint-disable*/
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const User = require(`${__dirname}/../models/userModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const AppError = require(`${__dirname}/../utils/appError`);
const factory = require(`${__dirname}/handlerFactory`);

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
        // user-3587267sdcfgsc525454-99912233333444.jpg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// });
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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
    if (!req.file) return next();

    const userImagesDir =  path.join(__dirname, '..', 'public', 'img', 'users');
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    const imagePath = path.join(userImagesDir, req.file.filename);

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(imagePath);
    
    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};


exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}


exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please try /updateMyPassword', 400));
    }
    
    // 2) filter out unwanted fields
    const filterBody = filterObj(req.body, 'name', 'email');
    if (req.file) {
        filterBody.photo = req.file.filename;
    }
    
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true, 
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});




exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! please use sign up instead.'
    });
};


exports.getUser = factory.getOne(User);
exports.getAllusers = factory.getAll(User);

// Do not update passwords wtih here.
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);