const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require(`${__dirname}/../models/tourModel`);
const Booking = require(`${__dirname}/../models/bookingModel`);
const catchAsync = require(`${__dirname}/../utils/catchAsync`);
const factory = require(`${__dirname}/handlerFactory`);


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // 2) Create Checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], 
        mode: 'payment', 
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, 
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, 
        customer_email: req.user.email, 
        client_reference_id: req.params.tourId, 
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
                    },
                },
                quantity: 1,
            }
        ]
    });

    // 3) Create a session as a response
    res.status(200).json({
        status: 'success', 
        session
    });
});


exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    //* this is only temporary, because it is UNSECURE: everyone cane book without paying
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?'));
});


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);