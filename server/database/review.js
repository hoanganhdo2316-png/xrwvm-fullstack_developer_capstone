const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  dealership: { type: Number, required: true, index: true },
  review: { type: String, required: true, trim: true, maxlength: 5000 },
  purchase: { type: Boolean, required: true },
  purchase_date: { type: String, default: '' },
  car_make: { type: String, required: true, trim: true, maxlength: 100 },
  car_model: { type: String, required: true, trim: true, maxlength: 100 },
  car_year: { type: Number, required: true },
}, { versionKey: false });

module.exports = mongoose.model('reviews', schema);
