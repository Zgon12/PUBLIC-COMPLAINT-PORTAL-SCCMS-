const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your ASEP 2 Verification Code',
        text: `Your 6-digit OTP for login is: ${otp}. It will expire in 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 OTP sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Email Error:', error);
        return false;
    }
};

const sendCategoryEmail = async (email, category) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Complaint Category',
        text: `Your complaint has been categorized successfully.\n\nCategory ID: ${category}\n\nYou can track it using this ID.`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const sendCustomEmail = async (email, id) => {
    console.log("📨 Inside sendCustomEmail:", email, id);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Custom Complaint Tracking ID',
        text: `Your complaint could not be categorized.\n\nTracking ID: ${id}\n\nPlease use this ID to track your complaint.`
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (err) {
        console.error(err);
        console.error("❌ Email Error:", err);
        return false;
    }
};

module.exports = { sendOTP };
module.exports = { sendOTP, sendCategoryEmail, sendCustomEmail };