const nodemailer = require('nodemailer');

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    // service: process.env.SERVICE,
    // auth: {
    //     user: process.env.SMARTKOP_USER,
    //     pass: process.env.SMARTKOP_PASS
    // }
});

    const message = {
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    }

    // const message = {
    //     from: process.env.SMARTKOP_USER,
    //     to: options.email,
    //     subject: options.subject,
    //     text: options.message,
    //     html: options.html
    // }

    await transporter.sendMail(message);
};

module.exports = sendEmail

