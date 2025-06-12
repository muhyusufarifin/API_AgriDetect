const mongoose = require("mongoose");

const DiseaseSchema = new mongoose.Schema({
  plant_name: {
    type: String,
    required: true,
  },
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
});

module.exports = mongoose.model("Disease", DiseaseSchema);
