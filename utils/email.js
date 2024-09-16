const nodemailer = require('nodemailer');

module.exports = class Email {
    constructor (user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `abdo adimy <${process.env.EMAIL_FROM}>`;
    }

    newTransport () {
        if (process.env.NODE_ENV === 'production') {
            // sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid', 
                auth: {
                    user: process.env.SENDGRID_USERNAME, 
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    async send (subject, content) {
        // 1) Render HTML based on the pug template
        // 2) Define the email options
        const mailOptions = {
            from : this.from,
            to: this.to,
            subject, 
            html: content, 
            text: content
        };
        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome () {
        await this.send(
            'Welcome to the Natours Family!', 
            `Welcome ${this.firstName}! We're glad to have you on board.`
        );
    }

    async sendPasswordReset () {
        await this.send(
            'Your password reset token (valid for only 10 minutes)', 
            `Hello ${this.firstName}, here is your password reset link: ${this.url}`
        );
    }
}