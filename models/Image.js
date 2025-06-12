const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
    unique: true, // Filename should be unique
  },
  filepath: { // Full path to the file on the server
    type: String,
    required: true,
  },
  uploaded_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', ImageSchema);