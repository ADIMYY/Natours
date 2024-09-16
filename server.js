// every thing is related to server (applications) not related to express
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('UNHANDLED EXCEPTION! 💥,  Shutting down.........');
    console.log(err);
    process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require(`${__dirname}/app`);

const DB = process.env.DATABASE.replace(
    '<PASSWORD>', 
    process.env.DATABASE_PASSWORD
);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connection established'));


const port = process.env.PORT || 3000; // if the environment variable PORT is not defined, the port will be set to 3000
const server = app.listen(port, () => {
    console.log(`listening on port ${port}.....`);
});


process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTED! 💥,  Shutting down.........');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});