const mongoose = require('mongoose');

const DeletedComplaintSchema = new mongoose.Schema({

    email: String,

    text: String,

    category: String,

    userID: String,

    adminID: String,

    image: String,

    status: String,

    deletedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model(
    'DeletedComplaint',
    DeletedComplaintSchema
);