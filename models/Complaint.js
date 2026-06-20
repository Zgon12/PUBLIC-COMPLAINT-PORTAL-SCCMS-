const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },

    text: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved'],
        default: 'pending'
    },

    adminID: {
        type: String,
        unique: true
    },

    image: {
    type: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    userID: {
    type: String
},

    isCustom: {
    type: Boolean,
    default: false
}
});

module.exports = mongoose.model('Complaint', ComplaintSchema);