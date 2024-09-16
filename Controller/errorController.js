const AppError = require(`${__dirname}/../utils/appError`);

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    console.log(value);

    const message = `Duplicate field value: ${value}. Please enter a valid value`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join(', ')}`;
    return new AppError(message, 400);
};

const handleJwtError = () =>
    new AppError('Invalid token. Please log in again', 401);

const handleJwtExpiredError = () => 
    new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}


const sendErrorProd = (err, res) => {
    // operational, trusted error: send message to client
    if (err.isOperational) {
        console.log(err.isOperational);
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    // programming or other unknown error: do not leak error details
    } else {
        // 1) log error
        console.error('Error 💥', err);

        // 2) send general error message
        res.status(500).json({
            status: 'error',
            message: 'something went wrong!'
        });
    }
};


module.exports = (err, req, res, next) => {      // Global error handler middleware
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;
        // error.name = err.name;
        // error.isOperational = err.isOperational;

        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJwtError();
        if (err.name === 'TokenExpiredError') error = handleJwtExpiredError();

        sendErrorProd(error, res);
    }
};