const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  thumbnailUrl: String,
  createdAt: { type: Date, default: Date.now },
  duration: Number,
  size: Number,
  tags: [String],
  meta: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model("Media", MediaSchema);


