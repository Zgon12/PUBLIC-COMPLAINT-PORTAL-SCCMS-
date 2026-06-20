const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    password: { type: String }, // Only filled for Admin
    otp: { type: String },      // Only used for Citizen login
    otpExpires: { type: Date }  // Security: OTP expires after 5-10 mins
});

module.exports = mongoose.model('User', UserSchema);