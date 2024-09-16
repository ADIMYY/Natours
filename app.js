const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require(`${__dirname}/utils/appError`);
const globalErrorHandler = require(`${__dirname}/Controller/errorController`);
const tourRouter = require(`${__dirname}/Routes/tourRoutes`);
const userRouter = require(`${__dirname}/Routes/userRoutes`);
const reviewRouter = require(`${__dirname}/Routes/reviewRoutes`);
const bookingRoutr = require(`${__dirname}/routes/bookingRoutes`);


// start express app
const app = express();


//   1)  GLOBAL MIDDLEWARE
app.use(express.static('public'));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// limmit requests from same api
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));  // return middleware (Third-party middleware)


// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent prameters pollution
app.use(hpp({
    whitelist: [
        'duration', 
        'ratingsAverage', 
        'ratingQuantity', 
        'maxGroupSize', 
        'difficulty', 
        'price'
    ]
}));


// Test Middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});




//   3) ROUTES
app.use('/api/v1/tours', tourRouter); // we use here middleware to connect this router to our application
app.use('/api/v1/users', userRouter); // (mountting)
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRoutr);


app.all('*', (req, res, next) => {
    next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);


module.exports = app;