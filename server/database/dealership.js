const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  city: { type: String, required: true }, state: { type: String, required: true }, st: String,
  address: { type: String, required: true }, zip: { type: String, required: true },
  lat: { type: Number, required: true }, long: { type: Number, required: true },
  short_name: String, full_name: { type: String, required: true }
}, { versionKey: false });
module.exports = mongoose.model('dealerships', schema);
