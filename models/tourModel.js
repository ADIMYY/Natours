const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require(`${__dirname}/userModel`);
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters']
        // validate: [validator.isAlpha, 'Tour name must only contain alpha characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'hard', 'difficult'],
            message: 'difficulty is either: easy, medium, hard'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10 // 4.666667 => 46.66667 => 47 => 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDicount: {
        type: Number,
        validate : {
            validator: function (val) {
                // this only points to current doc on NEW document creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) must be below regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a image cover']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false  // => hide
    },
    startDates: [String],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () { // not part of the database
    return this.duration / 7;
});


// tourSchema.virtual('looool').get(function () {
//     return 'loooooool';
// });
tourSchema.virtual('reviews', { // => must populate to work
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// embaded guide into tour model.
// tourSchema.pre('save', async function (next) {
//     const guidesPromise = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromise);
//     next();
// });


// tourSchema.pre('save', function (next) {
//     console.log('well save document...');
//     next();
// });

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// })


// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne : true } });
    
    this.start = Date.now();
    next();
});


tourSchema.pre(/^find/, function (next) {
    this.populate({
        path : 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

tourSchema.post(/^find/, function (docs, next) {
    console.log(`query took ${Date.now() - this.start} ms`);
    next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift( { $match: { secretTour: { $ne: true } } } );
//     console.log(this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;