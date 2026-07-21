const cors = require('cors');
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const Dealerships = require('./dealership');
const Reviews = require('./review');

const app = express();
const port = Number(process.env.PORT || 3030);
const mongoUrl = process.env.MONGODB_URL || 'mongodb://mongo_db:27017/dealershipsDB';

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

const seedData = (file, key) => JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'),
)[key];
const parseInteger = (value) => {
  const text = String(value);
  return /^\d+$/.test(text) ? Number(text) : Number.NaN;
};
const validId = (value) => Number.isSafeInteger(value) && value > 0;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function seedIfEmpty() {
  if (await Reviews.countDocuments() === 0) {
    await Reviews.insertMany(seedData('reviews.json', 'reviews'));
  }
  if (await Dealerships.countDocuments() === 0) {
    await Dealerships.insertMany(seedData('dealerships.json', 'dealerships'));
  }
}

app.get('/', (req, res) => res.json({ message: 'Dealership MongoDB API', status: 'ok' }));
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'unavailable', database: connected });
});

app.get('/fetchReviews', async (req, res) => {
  try {
    return res.json(await Reviews.find().sort({ id: 1 }).lean());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch reviews' });
  }
});

app.get('/fetchReviews/dealer/:id', async (req, res) => {
  const id = parseInteger(req.params.id);
  if (!validId(id)) return res.status(400).json({ error: 'Invalid dealer ID' });
  try {
    return res.json(await Reviews.find({ dealership: id }).sort({ id: 1 }).lean());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch dealer reviews' });
  }
});

app.get('/fetchDealers', async (req, res) => {
  try {
    return res.json(await Dealerships.find().sort({ id: 1 }).lean());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch dealerships' });
  }
});

app.get('/fetchDealers/:state', async (req, res) => {
  const state = req.params.state.trim();
  if (!state || state.length > 50) return res.status(400).json({ error: 'Invalid state' });
  const exact = new RegExp(`^${escapeRegex(state)}$`, 'i');
  const query = /^all$/i.test(state) ? {} : { $or: [{ state: exact }, { st: exact }] };
  try {
    return res.json(await Dealerships.find(query).sort({ id: 1 }).lean());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch dealerships by state' });
  }
});

app.get('/fetchDealer/:id', async (req, res) => {
  const id = parseInteger(req.params.id);
  if (!validId(id)) return res.status(400).json({ error: 'Invalid dealer ID' });
  try {
    const dealer = await Dealerships.findOne({ id }).lean();
    return dealer ? res.json(dealer) : res.status(404).json({ error: 'Dealership not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch dealership' });
  }
});

app.post('/insert_review', async (req, res) => {
  const data = req.body || {};
  const required = ['name', 'dealership', 'review', 'car_make', 'car_model', 'car_year'];
  const missing = required.filter((field) => data[field] === undefined || String(data[field]).trim() === '');
  if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  const dealership = parseInteger(data.dealership);
  const carYear = parseInteger(data.car_year);
  const currentYear = new Date().getFullYear();
  const purchase = data.purchase === true;
  const purchaseDate = String(data.purchase_date || '').trim();
  if (!validId(dealership) || !Number.isInteger(carYear) || carYear < 2015 || carYear > currentYear + 1) {
    return res.status(400).json({ error: 'Invalid dealership or car year' });
  }
  if (purchase && !purchaseDate) {
    return res.status(400).json({ error: 'A purchase date is required for purchased vehicles' });
  }

  try {
    if (!(await Dealerships.exists({ id: dealership }))) {
      return res.status(404).json({ error: 'Dealership not found' });
    }
    const latest = await Reviews.findOne().sort({ id: -1 }).select('id').lean();
    const saved = await Reviews.create({
      id: latest ? latest.id + 1 : 1,
      name: String(data.name).trim(),
      dealership,
      review: String(data.review).trim(),
      purchase,
      purchase_date: purchaseDate,
      car_make: String(data.car_make).trim(),
      car_model: String(data.car_model).trim(),
      car_year: carYear,
    });
    return res.status(201).json(saved.toObject());
  } catch (error) {
    return res.status(500).json({ error: 'Unable to insert review' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  return next(error);
});

async function start() {
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10000 });
  await seedIfEmpty();
  return app.listen(port, () => console.log(`Server is running on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Unable to start database API: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { app, start, seedIfEmpty };
