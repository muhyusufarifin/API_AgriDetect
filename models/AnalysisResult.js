const mongoose = require('mongoose');

const AnalysisResultSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image_filename: {
    type: String,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  plant_name_detected: {
    type: String,
    required: true,
  },
  diseases_detected: [
    {
      disease_name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      solution: {
        type: String,
        required: true,
      },
    },
  ],
  // <<< PERUBAHAN DI SINI: NAMA FIELD MENJADI 'confidence'
  confidence: { // Simpan sebagai String karena Anda sudah memformatnya dengan toFixed(2)
    type: String,
    required: false, // Atau true jika Anda selalu mengharapkan confidence
  },
  analysis_date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('AnalysisResult', AnalysisResultSchema);