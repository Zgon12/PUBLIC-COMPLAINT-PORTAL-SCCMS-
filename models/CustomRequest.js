const mongoose = require('mongoose');

const CustomRequestSchema = new mongoose.Schema({
    text: String,
    suggestedCategory: String,
    userSuggestion: String,
    finalCategory: String,
    email: String,
    status: {
        type: String,
        default: "Pending"
    }
});

module.exports = mongoose.model('CustomRequest', CustomRequestSchema);